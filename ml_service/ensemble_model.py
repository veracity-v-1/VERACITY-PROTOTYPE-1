"""
ensemble_model.py --- Project Veracity
EnsembleModel wrapper for XGBoost + Random Forest.
Separating this allows shap_service.py to import it without loading train.py.
"""
import numpy as np


class EnsembleModel:
    """Blends XGBoost + Random Forest for FastAPI compatibility."""
    
    def __init__(self, xgb_model, rf_model, xgb_weight=0.6):
        self.xgb_model = xgb_model
        self.rf_model = rf_model
        self.xgb_weight = xgb_weight
    
    def predict_proba(self, X):
        xgb_probs = self.xgb_model.predict_proba(X)[:, 1]
        rf_probs = self.rf_model.predict_proba(X)[:, 1]
        ensemble = self.xgb_weight * xgb_probs + (1 - self.xgb_weight) * rf_probs
        result = np.zeros((len(ensemble), 2))
        result[:, 1] = ensemble
        result[:, 0] = 1 - ensemble
        return result
    
    def predict(self, X):
        return (self.predict_proba(X)[:, 1] >= 0.5).astype(int)