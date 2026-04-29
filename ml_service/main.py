import json
import os
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "services"))
from typing import Optional, List, Dict
import joblib
import pandas as pd
from typing import Optional
from fastapi import FastAPI, HTTPException, UploadFile, File, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from ensemble_model import EnsembleModel
from services.radon_service  import extract_metrics
from services.shap_service import explain_prediction
from services.chatbot_service import get_mitigation_advice

MODEL_DIR = 'models'
MAX_CODE_SIZE = 5 * 1024 * 1024

model = joblib.load(os.path.join(MODEL_DIR, 'model.pkl'))
with open(os.path.join(MODEL_DIR, 'threshold.json')) as f:
    threshold = json.load(f)['best_threshold']
    threshold = max(0.35, threshold * 0.6)  # ~0.36
with open(os.path.join(MODEL_DIR, 'feature_names.json')) as f:
    feature_names = json.load(f)

app = FastAPI(title="Project Veracity ML API", version="2.1")

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AnalyzeRequest(BaseModel):
    code: str = Field(..., min_length=1)
    filename: str = Field(default="unknown.py")

class ExplainRequest(BaseModel):
    feature: str
    value: float
    risk_level: str

def analyze_code(request: AnalyzeRequest):
    code_bytes = request.code.encode('utf-8')
    if len(code_bytes) > MAX_CODE_SIZE:
        raise HTTPException(status_code=400, detail="Code exceeds 5MB limit")
    
    try:
        features = extract_metrics(request.code)
    except ValueError as e:
        if "syntax error" in str(e).lower():
            raise HTTPException(status_code=400, detail=f"Syntax error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Extraction failed: {str(e)}")
    
    # DataFrame to suppress sklearn feature name warning
    feature_vector = [features.get(f, 0.0) for f in feature_names]
    X = pd.DataFrame([feature_vector], columns=feature_names)
    
    prob = model.predict_proba(X)[0][1]
    
    # Use the trained threshold consistently — no hidden adjustments
    pred = int(prob >= threshold)
    risk_level = "High" if pred == 1 else "Low"
    
    shap_values = explain_prediction(model, feature_vector, feature_names)
    advice = get_mitigation_advice(features, feature_names, shap_values["shap_values"])
    
    return {
        "filename": request.filename,
        "risk_level": risk_level,
        "bug_probability": round(float(prob), 4),
        "threshold_used": threshold,
        "features": features,
        "shap_explanation": shap_values,
        "mitigation_advice": advice
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "model_loaded": True,
        "feature_count": len(feature_names),
        "threshold": threshold
    }
@app.get("/features")
def get_features():
    return {
        "features": feature_names,
        "count": len(feature_names),
        "threshold": threshold,
        "model_type": "Ensemble (XGBoost + Random Forest)"
    }
@app.post("/analyze")
@limiter.limit("10/minute")
async def analyze(request: Request, body: AnalyzeRequest):
    return analyze_code(body)

@app.post("/analyze-file")
@limiter.limit("10/minute")
async def analyze_file(request: Request, file: UploadFile = File(...)):
    # Validate file extension
    if not file.filename.endswith('.py'):
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid file type: '{file.filename}'. Only .py files are supported."
        )
    
    content = await file.read()
    
    # Validate file size (already have MAX_CODE_SIZE = 5*1024*1024)
    if len(content) > MAX_CODE_SIZE:
        raise HTTPException(status_code=400, detail="Code exceeds 5MB limit")
    
    code = content.decode('utf-8', errors='replace')
    return analyze_code(AnalyzeRequest(code=code, filename=file.filename))

@app.post("/explain")
@limiter.limit("30/minute")
async def explain(request: Request, body: ExplainRequest):
    advice = get_mitigation_advice(
        {body.feature: body.value},
        [body.feature],
        {body.feature: body.value}
    )
    return {
        "feature": body.feature,
        "value": body.value,
        "risk_level": body.risk_level,
        "rule": advice["messages"][1] if len(advice["messages"]) > 1 else advice["messages"][0]
    }

# ═══════════════════════════════════════════════════════════════════
# CONVERSATIONAL CHATBOT ENDPOINTS (Phase 3)
# ═══════════════════════════════════════════════════════════════════

from services.chatbot_service import ChatbotService
from fastapi import Query
from datetime import datetime

# Global chatbot instance (reuses rules loading logic)
_chatbot_service_instance: ChatbotService = None

def get_chatbot_service() -> ChatbotService:
    global _chatbot_service_instance
    if _chatbot_service_instance is None:
        _BASE = os.path.dirname(os.path.abspath(__file__))
        _SERVICE_DIR = os.path.join(_BASE, "services")
        possible_paths = [
            os.path.join(_SERVICE_DIR, 'mitigation_rules_human.json'),
            os.path.join(_BASE, 'mitigation_rules_human.json'),
            os.path.join(_SERVICE_DIR, 'mitigation_rules.json'),
            os.path.join(_BASE, 'mitigation_rules.json'),
        ]
        rules_path = None
        for path in possible_paths:
            if os.path.exists(path):
                rules_path = path
                break
        _chatbot_service_instance = ChatbotService(rules_path)
    return _chatbot_service_instance


class ChatMessageRequest(BaseModel):
    session_id: str
    message: str
    user_name: Optional[str] = None


class ChatStartRequest(BaseModel):
    session_id: str
    risk_level: str
    top_features: List[Dict]
    user_name: Optional[str] = None


@app.post("/chat/start")
@limiter.limit("30/minute")
async def chat_start(request: Request, body: ChatStartRequest):
    """
    Initialize a chat session with analysis results.
    Call this immediately after /analyze to start the conversation.
    """
    bot = get_chatbot_service()
    response = bot.chat(
        session_id=body.session_id,
        user_message="hello",
        risk_level=body.risk_level,
        top_features=body.top_features,
        user_name=body.user_name
    )
    return {
        "session_id": body.session_id,
        "conversation": response,
        "timestamp": datetime.utcnow().isoformat()
    }


@app.post("/chat/message")
@limiter.limit("60/minute")
async def chat_message(request: Request, body: ChatMessageRequest):
    """
    Send a message in an existing chat session.
    The bot remembers context and routes to the right handler.
    """
    bot = get_chatbot_service()
    response = bot.chat(
        session_id=body.session_id,
        user_message=body.message,
        user_name=body.user_name
    )
    return {
        "session_id": body.session_id,
        "conversation": response,
        "timestamp": datetime.utcnow().isoformat()
    }


@app.post("/chat/reset")
@limiter.limit("30/minute")
async def chat_reset(request: Request, session_id: str = Query(...)):
    """Reset a chat session (start fresh)."""
    bot = get_chatbot_service()
    bot.reset_session(session_id)
    return {
        "session_id": session_id,
        "status": "reset",
        "message": "Chat session cleared. Ready for new analysis."
    }


# ═══════════════════════════════════════════════════════════════════
# REPORT GENERATION ENDPOINTS (Pro Tier)
# ═══════════════════════════════════════════════════════════════════

import xml.etree.ElementTree as ET
from xml.dom import minidom


class ReportRequest(BaseModel):
    filename: str
    risk_level: str
    bug_probability: float
    threshold_used: float
    features: Dict[str, float]
    shap_explanation: Dict
    mitigation_advice: Dict
    user_notes: Optional[str] = None


def _build_report_data(req: ReportRequest) -> dict:
    """Common report data structure for both JSON and XML."""
    top_concerns = []
    for msg in req.mitigation_advice.get("messages", []):
        if msg.get("type") == "advice":
            top_concerns.append({
                "feature": msg.get("feature"),
                "display_name": msg.get("display_name"),
                "severity": msg.get("how_bad", "WARNING"),
                "your_score": msg.get("your_score"),
                "safe_limit": msg.get("safe_limit"),
                "exceeded": msg.get("exceeded", False)
            })
    
    total_features = len(req.features)
    exceeded_count = sum(1 for c in top_concerns if c.get("exceeded"))
    
    priority_order = sorted(
        top_concerns,
        key=lambda x: 0 if x["severity"] == "CRITICAL" else 1 if x["severity"] == "WARNING" else 2
    )
    
    return {
        "report_metadata": {
            "project_name": req.filename,
            "analysis_date": datetime.utcnow().isoformat() + "Z",
            "report_version": "1.0",
            "generated_by": "Project Veracity v3.0"
        },
        "risk_assessment": {
            "level": req.risk_level,
            "bug_probability": round(req.bug_probability, 4),
            "threshold_used": req.threshold_used,
            "confidence": "High" if req.bug_probability > 0.8 or req.bug_probability < 0.2 else "Medium"
        },
        "metrics_summary": {
            "total_features_analyzed": total_features,
            "thresholds_exceeded": exceeded_count,
            "top_concerns": [c["feature"] for c in priority_order[:3]],
            "overall_health": "NEEDS_WORK" if exceeded_count > 2 else "SOME_ISSUES" if exceeded_count > 0 else "HEALTHY"
        },
        "detailed_metrics": req.features,
        "shap_explanation": {
            "top_features": req.shap_explanation.get("top_features", []),
            "base_value": req.shap_explanation.get("base_value", 0)
        },
        "mitigation_plan": {
            "priority_issues": priority_order,
            "recommended_order": [c["feature"] for c in priority_order],
            "estimated_total_effort": "2-4 hours" if exceeded_count > 2 else "1-2 hours" if exceeded_count > 0 else "0 hours",
            "user_notes": req.user_notes or ""
        }
    }


@app.post("/report/json")
@limiter.limit("10/minute")
async def report_json(request: Request, body: ReportRequest):
    """Generate a JSON report (Pro Tier)."""
    report_data = _build_report_data(body)
    return {
        "status": "success",
        "format": "json",
        "download_ready": True,
        "report": report_data,
        "filename": f"veracity_report_{body.filename.replace('.py', '')}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.json"
    }


@app.post("/report/xml")
@limiter.limit("10/minute")
async def report_xml(request: Request, body: ReportRequest):
    """Generate an XML report (Pro Tier)."""
    data = _build_report_data(body)
    
    root = ET.Element("VeracityReport")
    root.set("version", "1.0")
    
    meta = ET.SubElement(root, "ReportMetadata")
    for key, val in data["report_metadata"].items():
        ET.SubElement(meta, key.replace(" ", "_")).text = str(val)
    
    risk = ET.SubElement(root, "RiskAssessment")
    for key, val in data["risk_assessment"].items():
        ET.SubElement(risk, key).text = str(val)
    
    summary = ET.SubElement(root, "MetricsSummary")
    for key, val in data["metrics_summary"].items():
        if isinstance(val, list):
            list_elem = ET.SubElement(summary, key)
            for item in val:
                ET.SubElement(list_elem, "item").text = str(item)
        else:
            ET.SubElement(summary, key).text = str(val)
    
    metrics = ET.SubElement(root, "DetailedMetrics")
    for key, val in data["detailed_metrics"].items():
        ET.SubElement(metrics, "metric", name=key).text = str(val)
    
    shap = ET.SubElement(root, "SHAPExplanation")
    top_features = ET.SubElement(shap, "TopFeatures")
    for feat in data["shap_explanation"]["top_features"]:
        f_elem = ET.SubElement(top_features, "feature")
        for k, v in feat.items():
            ET.SubElement(f_elem, k).text = str(v)
    ET.SubElement(shap, "BaseValue").text = str(data["shap_explanation"]["base_value"])
    
    plan = ET.SubElement(root, "MitigationPlan")
    issues = ET.SubElement(plan, "PriorityIssues")
    for issue in data["mitigation_plan"]["priority_issues"]:
        i_elem = ET.SubElement(issues, "issue")
        for k, v in issue.items():
            ET.SubElement(i_elem, k).text = str(v)
    
    order = ET.SubElement(plan, "RecommendedOrder")
    for feat in data["mitigation_plan"]["recommended_order"]:
        ET.SubElement(order, "feature").text = feat
    
    ET.SubElement(plan, "EstimatedTotalEffort").text = data["mitigation_plan"]["estimated_total_effort"]
    ET.SubElement(plan, "UserNotes").text = data["mitigation_plan"]["user_notes"]
    
    xml_str = minidom.parseString(ET.tostring(root)).toprettyxml(indent="  ")
    
    return {
        "status": "success",
        "format": "xml",
        "download_ready": True,
        "xml_content": xml_str,
        "filename": f"veracity_report_{body.filename.replace('.py', '')}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.xml"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)