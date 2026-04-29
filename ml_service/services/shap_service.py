"""
shap_service.py --- Project Veracity
Wraps model with SHAP TreeExplainer.
Handles both EnsembleModel and raw XGBClassifier.
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import json
from typing import List, Dict
import numpy as np
import pandas as pd
import shap


class SHAPExplainer:
    """Thin wrapper around shap.TreeExplainer."""

    def __init__(self, model, feature_names: List[str]):
        # Handle both EnsembleModel and raw XGBClassifier
        if hasattr(model, 'xgb_model'):
            tree_model = model.xgb_model
        else:
            tree_model = model
            
        self.explainer = shap.TreeExplainer(tree_model)
        self.feature_names = feature_names

    def explain(self, metrics_dict: dict, top_n: int = 5) -> dict:
        """Compute SHAP values for a single code file's metrics."""
        row = {f: float(metrics_dict.get(f, 0.0)) for f in self.feature_names}
        X = pd.DataFrame([row], columns=self.feature_names)
        shap_raw = self.explainer.shap_values(X)

        if isinstance(shap_raw, list):
            sv = shap_raw[1][0]
        else:
            sv = shap_raw[0]

        feature_impacts: Dict[str, float] = {
            name: float(val) for name, val in zip(self.feature_names, sv)
        }

        sorted_features = sorted(
            feature_impacts.items(),
            key=lambda x: abs(x[1]),
            reverse=True,
        )

        top_features = [
            {
                "feature": name,
                "shap_value": round(val, 6),
                "direction": "increases_risk" if val > 0 else "decreases_risk",
                "metric_value": round(float(metrics_dict.get(name, 0.0)), 4),
            }
            for name, val in sorted_features[:top_n]
        ]

        base = self.explainer.expected_value
        if isinstance(base, (list, np.ndarray)):
            base = float(base[1])
        else:
            base = float(base)

        return {
            "shap_values": {k: round(v, 6) for k, v in feature_impacts.items()},
            "top_features": top_features,
            "base_value": base,
        }


# ── Wrapper for main.py compatibility ─────────────────────────────

def explain_prediction(model, feature_vector, feature_names):
    explainer = SHAPExplainer(model, feature_names)
    metrics = {name: float(val) for name, val in zip(feature_names, feature_vector)}
    return explainer.explain(metrics, top_n=5)


# ── Standalone test ─────────────────────────────────────────────────
if __name__ == "__main__":
    import joblib

    _BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    _MODEL_PATH = os.path.join(_BASE, "models", "model.pkl")
    _FEATS_PATH = os.path.join(_BASE, "models", "feature_names.json")

    if not os.path.exists(_MODEL_PATH):
        raise FileNotFoundError(f"model.pkl not found — run train.py first")
    if not os.path.exists(_FEATS_PATH):
        raise FileNotFoundError(f"feature_names.json not found — run train.py first")

    print("Loading model...")
    model = joblib.load(_MODEL_PATH)
    
    with open(_FEATS_PATH) as f:
        feature_names = json.load(f)

    print(f"✅ Loaded model (type: {type(model).__name__}) with {len(feature_names)} features")
    
    explainer = SHAPExplainer(model, feature_names)

    dummy_metrics = {f: 5.0 for f in feature_names}
    dummy_metrics.update({
        "loc": 250.0,
        "v(g)": 18.0,
        "n": 50.0,
        "v": 820.0,
        "e": 15000.0,
        "b": 3.2,
        "d": 40.0,
        "branchcount": 22.0,
        "cbo": 0.0,
        "rfc": 0.0,
    })

    result = explainer.explain(dummy_metrics, top_n=5)
    print(f"\nshap_service.py ✅ Standalone test passed")
    print(f"Top feature: {result['top_features'][0]['feature']}")
    print(json.dumps(result, indent=2))