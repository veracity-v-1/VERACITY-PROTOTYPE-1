"""
test_chat_report.py --- Quick test for chat + report endpoints
Run this while main.py is running in another terminal.
"""
import requests
import json

BASE = "http://localhost:8080"

def pretty_print(label, data):
    print(f"\n{'='*60}")
    print(f"  {label}")
    print(f"{'='*60}")
    print(json.dumps(data, indent=2)[:2000])
    print("...")

# 1. Analyze HIGH-RISK code (to get real exceeded thresholds)
print("Step 1: Analyzing HIGH-RISK code...")
high_risk_code = '''
import os, sys, re, json, datetime

def process_user_data(data, config, db, logger, cache, auth):
    results = []
    errors = []
    warnings = []
    if data and len(data) > 0:
        for idx, item in enumerate(data):
            if item.get('active') and item.get('permissions'):
                if item.get('type') == 'premium':
                    if config.get('premium_enabled') and config.get('premium_rate') > 0:
                        if db and db.connection and db.connection.is_open():
                            if item.get('credits') > 100 and item.get('verified') == True:
                                if auth.check_role(item['user_id'], 'premium'):
                                    try:
                                        processed = db.query("INSERT INTO transaction_logs (user_id, amount, currency, status, timestamp) VALUES (?, ?, ?, ?, ?)",
                                            (item['user_id'], item['amount'], item['currency'], 'completed', datetime.datetime.now()))
                                        cache.set(f"user:{item['user_id']}:last_tx", processed, ttl=3600)
                                        results.append(processed)
                                        logger.info(f"Processed premium for {item['user_id']}")
                                    except Exception as e:
                                        logger.error(f"DB error: {str(e)}")
                                        errors.append({'user': item['user_id'], 'error': str(e)})
                                else:
                                    warnings.append(f"User {item['user_id']} lacks premium role")
                                    logger.warning(f"Role check failed for {item['user_id']}")
                            else:
                                if item.get('credits', 0) <= 100:
                                    warnings.append(f"Low credits: {item['user_id']}")
                                if not item.get('verified'):
                                    warnings.append(f"Not verified: {item['user_id']}")
                        else:
                            raise ConnectionError(f"Database connection unavailable at {datetime.datetime.now()}")
                    else:
                        continue
                elif item.get('type') == 'basic':
                    if config.get('basic_enabled'):
                        results.append({'id': item['id'], 'status': 'basic', 'processed_at': datetime.datetime.now()})
                    else:
                        errors.append({'id': item['id'], 'reason': 'basic_disabled'})
                elif item.get('type') == 'enterprise':
                    if config.get('enterprise_enabled') and auth.check_role(item['user_id'], 'enterprise'):
                        if item.get('contract_id') and item.get('sla_level'):
                            processed = db.query("INSERT INTO enterprise_logs VALUES (?, ?, ?, ?)",
                                (item['contract_id'], item['user_id'], item['sla_level'], json.dumps(item['metadata'])))
                            results.append(processed)
                        else:
                            errors.append({'id': item['id'], 'reason': 'missing_enterprise_fields'})
                    else:
                        warnings.append(f"Enterprise access denied for {item['user_id']}")
                else:
                    logger.error(f"Unknown user type: {item.get('type')} for user {item.get('id')}")
                    errors.append({'id': item['id'], 'reason': 'unknown_type'})
            else:
                if not item.get('active'):
                    results.append({'id': item['id'], 'status': 'inactive'})
                if not item.get('permissions'):
                    warnings.append(f"No permissions: {item['id']}")
    return {'results': results, 'errors': errors, 'warnings': warnings, 'summary': {'total': len(data), 'success': len(results), 'failed': len(errors)}}
'''

r = requests.post(f"{BASE}/analyze", json={"code": high_risk_code, "filename": "high_risk.py"})
result = r.json()
pretty_print("ANALYZE RESULT", {
    "risk_level": result.get("risk_level"),
    "bug_probability": result.get("bug_probability"),
    "feature_count": len(result.get("features", {})),
    "top_shap": result.get("shap_explanation", {}).get("top_features", [])[:3]
})

# Extract data
mitigation = result.get("mitigation_advice", {})
top_features = result.get("shap_explanation", {}).get("top_features", [])
features = result.get("features", {})
risk_level = result.get("risk_level", "Low")
prob = result.get("bug_probability", 0)
threshold = result.get("threshold_used", 0.66)

# 2. Start chat
print("\nStep 2: Starting chat...")
chat_start = requests.post(f"{BASE}/chat/start", json={
    "session_id": "demo_session_002",
    "risk_level": risk_level,
    "top_features": top_features,
    "user_name": "Alex"
}).json()
pretty_print("CHAT START", chat_start)

# 3. Ask for biggest problem
print("\nStep 3: Asking for biggest problem...")
chat_msg = requests.post(f"{BASE}/chat/message", json={
    "session_id": "demo_session_002",
    "message": "show me the biggest problem"
}).json()

# Extract the actual feature shown from the response
advice_msgs = [m for m in chat_msg.get("conversation", {}).get("messages", []) if m.get("type") == "advice"]
if advice_msgs:
    shown_feature = advice_msgs[0].get("feature")
    print(f"  -> Bot showed: {shown_feature} ({advice_msgs[0].get('display_name')})")
    print(f"  -> Exceeded: {advice_msgs[0].get('exceeded')}, Severity: {advice_msgs[0].get('how_bad')}")
else:
    shown_feature = None
    print("  -> No advice shown (possibly low risk)")

pretty_print("CHAT MESSAGE", chat_msg)

# 4. Ask for fix (use the ACTUAL feature from step 3, not from analyze)
print("\nStep 4: Asking for fix steps...")
if shown_feature:
    fix_msg = f"fix:{shown_feature}"
else:
    fix_msg = "show_menu"

chat_fix = requests.post(f"{BASE}/chat/message", json={
    "session_id": "demo_session_002",
    "message": fix_msg
}).json()
pretty_print("CHAT FIX", chat_fix)

# 5. Ask why it matters
print("\nStep 5: Asking why it matters...")
if shown_feature:
    why_msg = f"why:{shown_feature}"
else:
    why_msg = "explain_metrics"

chat_why = requests.post(f"{BASE}/chat/message", json={
    "session_id": "demo_session_002",
    "message": why_msg
}).json()
pretty_print("CHAT WHY", chat_why)

# 6. Close conversation
print("\nStep 6: Closing conversation...")
chat_close = requests.post(f"{BASE}/chat/message", json={
    "session_id": "demo_session_002",
    "message": "thanks, done"
}).json()
pretty_print("CHAT CLOSE", chat_close)

# 7. Generate JSON report
print("\nStep 7: Generating JSON report...")
report_json = requests.post(f"{BASE}/report/json", json={
    "filename": "high_risk.py",
    "risk_level": risk_level,
    "bug_probability": prob,
    "threshold_used": threshold,
    "features": features,
    "shap_explanation": result.get("shap_explanation", {}),
    "mitigation_advice": mitigation,
    "user_notes": "Test report from automated script"
}).json()
pretty_print("JSON REPORT", {
    "status": report_json.get("status"),
    "filename": report_json.get("filename"),
    "health": report_json.get("report", {}).get("metrics_summary", {}).get("overall_health"),
    "effort": report_json.get("report", {}).get("mitigation_plan", {}).get("estimated_total_effort"),
    "exceeded_count": report_json.get("report", {}).get("metrics_summary", {}).get("thresholds_exceeded")
})

# 8. Generate XML report
print("\nStep 8: Generating XML report...")
report_xml = requests.post(f"{BASE}/report/xml", json={
    "filename": "high_risk.py",
    "risk_level": risk_level,
    "bug_probability": prob,
    "threshold_used": threshold,
    "features": features,
    "shap_explanation": result.get("shap_explanation", {}),
    "mitigation_advice": mitigation
}).json()
pretty_print("XML REPORT", {
    "status": report_xml.get("status"),
    "filename": report_xml.get("filename"),
    "xml_preview": report_xml.get("xml_content", "")[:300] + "..."
})

print("\n" + "="*60)
print("  ALL TESTS COMPLETE")
print("="*60)