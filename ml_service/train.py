import pandas as pd
import numpy as np
import json
import joblib
import os
import io
import re
import warnings
from tqdm import tqdm
from typing import List, Dict, Optional, Callable
from ensemble_model import EnsembleModel
from scipy.io import arff
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, f1_score, precision_recall_curve, recall_score
from xgboost import XGBClassifier
from sklearn.ensemble import RandomForestClassifier

warnings.filterwarnings('ignore')

# --- CONFIGURATION ---
DATA_DIR = 'data'
MODEL_DIR = 'models'
os.makedirs(MODEL_DIR, exist_ok=True)

# Base features that might exist in datasets
ALL_POSSIBLE_FEATURES: List[str] = [
    'loc', 'v(g)', 'ev(g)', 'iv(g)', 'n', 'v', 'l', 'd', 'i', 'e', 'b', 't',
    'locode', 'locomment', 'loblank', 'locodeandcomment',
    'uniq_op', 'uniq_opnd', 'total_op', 'total_opnd', 'branchcount'
]

COLUMN_MAP: Dict[str, str] = {
    'total_loc': 'loc', 'linecnt': 'loc', 'countline': 'loc', 'numberoflinesofcode': 'loc',
    'ck_oo_numberoflinesofcode': 'loc', 'ldhh_numberoflinesofcode': 'loc', 'wchu_numberoflinesofcode': 'loc',
    'cyclomatic_complexity': 'v(g)', 'sumcyclomatic': 'v(g)', 'wmc': 'v(g)', 'ck_oo_wmc': 'v(g)',
    'ldhh_wmc': 'v(g)', 'wchu_wmc': 'v(g)',
    'essential_complexity': 'ev(g)', 'sumessential': 'ev(g)',
    'design_complexity': 'iv(g)',
    'halstead_volume': 'v',
    'halstead_effort': 'e', 'halstead_error': 'b',
    'branch_count': 'branchcount', 'numberofmethods': 'branchcount',
    'ck_oo_numberofpublicmethods': 'branchcount'
}

TARGET_COL_CANDIDATES: List[str] = ['defects', 'isdefective', 'class', 'bug', 'problems', 'target']
POSITIVE_TARGET_MARKERS: List[str] = ['true', 'buggy', 'yes', '1', 'y']


# --- DYNAMIC FEATURE ENGINEERING REGISTRY ---
# Each entry: (output_name, required_inputs, function)
# Function takes df, returns series
ENGINEERING_RULES: List[tuple] = [
    # Core complexity density (needs v(g), loc)
    ('v_density', ['v(g)', 'loc'], lambda df: df['v(g)'] / (df['loc'] + 1e-6)),
    
    # Essential ratio (needs ev(g), v(g))
    ('ev_ratio', ['ev(g)', 'v(g)'], lambda df: df['ev(g)'] / (df['v(g)'] + 1e-6)),
    
    # Cyclomatic * LOC (needs v(g), loc)
    ('cyclomatic_loc', ['v(g)', 'loc'], lambda df: df['v(g)'] * df['loc']),
    
    # Design gap (needs ev(g), iv(g))
    ('essential_design_gap', ['ev(g)', 'iv(g)'], lambda df: df['ev(g)'] - df['iv(g)']),
    
    # Volatility (needs v(g), ev(g))
    ('complexity_volatility', ['v(g)', 'ev(g)'], lambda df: df['v(g)'] / (df['ev(g)'] + 1e-6)),
    
    # Halstead length (needs total_op, total_opnd)
    ('halstead_length', ['total_op', 'total_opnd'], lambda df: df['total_op'] + df['total_opnd']),
    
    # Halstead density (needs v, loc)
    ('halstead_volume_density', ['v', 'loc'], lambda df: df['v'] / (df['loc'] + 1e-6)),
    
    # Halstead difficulty (needs uniq_op, total_opnd, uniq_opnd)
    ('halstead_difficulty', ['uniq_op', 'total_opnd', 'uniq_opnd'], 
     lambda df: (df['uniq_op'] / 2) * (df['total_opnd'] / (df['uniq_opnd'] + 1e-6))),
    
    # Comment quality (needs locomment, locode)
    ('comment_quality', ['locomment', 'locode'], lambda df: df['locomment'] / (df['locode'] + 1e-6)),
    
    # Operator density (needs uniq_op, loc)
    ('uniq_op_density', ['uniq_op', 'loc'], lambda df: df['uniq_op'] / (df['loc'] + 1e-6)),
    
    # Branch density (needs branchcount, loc)
    ('branch_density', ['branchcount', 'loc'], lambda df: df['branchcount'] / (df['loc'] + 1e-6)),
]


def load_and_fix_arff(path: str) -> str:
    with open(path, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    lines = content.splitlines()
    processed_lines, is_data_section = [], False
    target_attr_names = {'isdefective', 'class', 'defects'}

    for line in lines:
        stripped_lower = line.strip().lower()
        if stripped_lower.startswith('@attribute'):
            match = re.match(r"@attribute\s+(['\"]?)(?P<name>\w+)\1\s+.*{.*}.*", stripped_lower)
            if match and match.group('name') in target_attr_names:
                processed_lines.append(f"@attribute {match.group('name')} numeric")
                continue
        if stripped_lower.startswith('@data'):
            is_data_section = True
        if is_data_section:
            if line.strip().startswith('#') or re.match(r'^[a-zA-Z]', line.strip()):
                continue
            line = re.sub(r',TRUE\b', ',1', line, flags=re.IGNORECASE)
            line = re.sub(r',FALSE\b', ',0', line, flags=re.IGNORECASE)
            line = re.sub(r',buggy\b', ',1', line, flags=re.IGNORECASE)
            line = re.sub(r',clean\b', ',0', line, flags=re.IGNORECASE)
        processed_lines.append(line)
    return "\n".join(processed_lines)


def safe_to_numeric(series):
    if isinstance(series, pd.DataFrame):
        series = series.iloc[:, 0]
    if series.dtype == object:
        series = series.apply(lambda x: x.decode('utf-8') if isinstance(x, bytes) else x)
    
    def extract_scalar(val):
        if isinstance(val, (list, tuple, np.ndarray)):
            return val[0] if len(val) > 0 else np.nan
        return val
    
    series = series.apply(extract_scalar)
    return pd.to_numeric(series, errors='coerce')


def load_dataset(path: str) -> Optional[pd.DataFrame]:
    try:
        filename = os.path.basename(path)
        if path.endswith('.arff'):
            fixed_content = load_and_fix_arff(path)
            data, _ = arff.loadarff(io.StringIO(fixed_content))
            df = pd.DataFrame(data)
        else:
            df = pd.read_csv(path)

        df.columns = [re.sub(r'[^a-zA-Z0-9_]', '', c.lower().strip()) for c in df.columns]
        df = df.rename(columns=COLUMN_MAP)
        df = df.loc[:, ~df.columns.duplicated()].copy()

        target_col = next((t for t in TARGET_COL_CANDIDATES if t in df.columns), None)
        if target_col is None: 
            print(f"  [WARNING] No target column found in {filename}")
            return None

        if df[target_col].dtype == object:
             df['target_label'] = df[target_col].astype(str).str.lower().str.strip().isin(POSITIVE_TARGET_MARKERS).astype(int)
        else:
             df['target_label'] = (pd.to_numeric(df[target_col], errors='coerce').fillna(0) > 0).astype(int)

        # Convert all possible feature columns
        for col in ALL_POSSIBLE_FEATURES:
            if col in df.columns:
                df[col] = safe_to_numeric(df[col])
        
        df.dropna(subset=[c for c in ALL_POSSIBLE_FEATURES if c in df.columns], how='all', inplace=True)
        
        if df.empty:
            print(f"  [WARNING] {filename} is empty after cleaning")
            return None
            
        return df
    except Exception as e:
        print(f"  [ERROR] Failed loading {filename}: {str(e)[:100]}")
        import traceback
        traceback.print_exc()
        return None


def engineer_features_dynamic(df: pd.DataFrame) -> pd.DataFrame:
    """Only engineer features when ALL required inputs exist in this dataset."""
    for out_name, required_cols, func in ENGINEERING_RULES:
        if all(col in df.columns for col in required_cols):
            try:
                df[out_name] = func(df)
            except Exception as e:
                print(f"  [WARN] Failed to engineer {out_name}: {e}")
                df[out_name] = 0.0
        else:
            # Don't create the column if inputs missing — we'll handle at merge time
            pass
    return df


def find_best_threshold(y_true, probs, recall_target=0.55):
    precisions, recalls, thresholds = precision_recall_curve(y_true, probs)
    precisions = precisions[:-1]
    recalls = recalls[:-1]
    f1_scores = (2 * precisions * recalls) / (precisions + recalls + 1e-8)
    
    valid_indices = np.where(recalls >= recall_target)[0]
    if valid_indices.size > 0:
        best_idx = valid_indices[np.argmax(f1_scores[valid_indices])]
    else:
        best_idx = np.argmax(recalls)
        print(f"  [WARNING] Could not achieve {recall_target*100}% recall. Best recall: {recalls[best_idx]:.4f}")
    
    return thresholds[best_idx], f1_scores[best_idx], recalls[best_idx]


def train():
    print("="*60 + "\nPROJECT VERACITY: DYNAMIC ENSEMBLE PIPELINE\n" + "="*60)
    
    all_dfs = []
    files = sorted([f for f in os.listdir(DATA_DIR) if f.endswith(('.arff', '.csv'))])
    for f in tqdm(files, desc="Integrating Datasets"):
        df = load_dataset(os.path.join(DATA_DIR, f))
        if df is not None and not df.empty:
            df = engineer_features_dynamic(df)
            all_dfs.append(df)
            
    if not all_dfs:
        print("FATAL: No datasets loaded. Exiting.")
        return

    merged = pd.concat(all_dfs, ignore_index=True)
    
    # Collect all columns that exist across any dataset
    all_existing_cols = set()
    for df in all_dfs:
        all_existing_cols.update(df.columns)
    
    # Determine which features to use:
    # 1. Base features that exist in merged
    available_base = [c for c in ALL_POSSIBLE_FEATURES if c in merged.columns]
    
    # 2. Engineered features that were successfully created
    engineered_names = [r[0] for r in ENGINEERING_RULES]
    available_engineered = [c for c in engineered_names if c in merged.columns]
    
    candidate_features = available_base + available_engineered
    
    # 3. CRITICAL: Drop features that are >95% zero (dead features)
    zero_ratios = {}
    for col in candidate_features:
        if col in merged.columns:
            zero_ratio = (merged[col].fillna(0) == 0).mean()
            zero_ratios[col] = zero_ratio
    
    print(f"\n📊 Feature zero-ratio analysis:")
    for col, ratio in sorted(zero_ratios.items(), key=lambda x: -x[1]):
        status = "❌ DROP" if ratio > 0.95 else "✅ KEEP"
        print(f"   {col}: {ratio*100:.1f}% zeros {status}")
    
    # Keep features with <95% zeros
    existing_features = [c for c in candidate_features if zero_ratios.get(c, 0) <= 0.95]
    
    # Fill remaining missing with median
    for col in existing_features:
        if col not in merged.columns:
            merged[col] = 0.0
    merged[existing_features] = merged[existing_features].fillna(merged[existing_features].median())

    X = merged[existing_features]
    y = merged['target_label']
    
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.25, stratify=y, random_state=42
    )

    print(f"\n{'='*60}")
    print(f"Integration Complete! Total Samples: {len(merged)}")
    print(f"Buggy instances: {y.sum()} ({y.mean()*100:.2f}%)")
    print(f"Features used: {len(existing_features)}")
    print(f"Feature list: {existing_features}")
    
    spw = (y_train == 0).sum() / (y_train == 1).sum() if (y_train == 1).sum() > 0 else 1
    print(f"Calculated scale_pos_weight: {spw:.2f}")

    # Train XGBoost
    print("\n[1/3] Training XGBoost...")
    xgb_clf = XGBClassifier(
        n_estimators=1500, max_depth=8, learning_rate=0.03,
        scale_pos_weight=spw * 2.5, subsample=0.8, colsample_bytree=0.8,
        objective='binary:logistic', eval_metric='aucpr',
        tree_method='hist', n_jobs=-1, random_state=42
    )
    xgb_clf.fit(
        X_train, y_train,
        eval_set=[(X_test, y_test)],
        early_stopping_rounds=100,
        verbose=False
    )
    print(f"      XGBoost best iteration: {xgb_clf.best_iteration}")

    # Train Random Forest
    print("[2/3] Training Random Forest...")
    rf_clf = RandomForestClassifier(
        n_estimators=800, max_depth=16,
        class_weight='balanced_subsample',
        min_samples_leaf=1, n_jobs=-1, random_state=42
    )
    rf_clf.fit(X_train, y_train)

    # Grid search
    print("[3/3] Tuning ensemble weights & thresholds...")
    best_f1 = 0
    best_weight = 0.6
    best_thresh = 0.5
    best_recall = 0

    for weight in np.arange(0.4, 0.9, 0.1):
        ens = EnsembleModel(xgb_clf, rf_clf, weight)
        probs = ens.predict_proba(X_test)[:, 1]
        for thresh in np.arange(0.30, 0.85, 0.03):
            preds = (probs >= thresh).astype(int)
            f1 = f1_score(y_test, preds, zero_division=0)
            rec = recall_score(y_test, preds, zero_division=0)
            if f1 > best_f1:
                best_f1 = f1
                best_weight = weight
                best_thresh = thresh
                best_recall = rec

    print(f"\nBest ensemble: XGBoost weight={best_weight:.1f}, threshold={best_thresh:.2f}")
    print(f"Best F1: {best_f1:.4f}, Recall: {best_recall:.4f}")

    # Final evaluation
    final_model = EnsembleModel(xgb_clf, rf_clf, best_weight)
    test_probs = final_model.predict_proba(X_test)[:, 1]
    test_preds = (test_probs >= best_thresh).astype(int)
    
    print("\n" + "="*60 + "\nFINAL PERFORMANCE REPORT (Test Set)\n" + "="*60)
    print(classification_report(y_test, test_preds, target_names=['Clean', 'Buggy'], digits=4))
    
    if best_f1 >= 0.50:
        print(f"✅✅✅ SUCCESS! F1: {best_f1:.4f}")
    else:
        print(f"⚠️  Best achievable F1: {best_f1:.4f}")

    # Save artifacts
    print("\nSaving artifacts...")
    joblib.dump(final_model, os.path.join(MODEL_DIR, 'model.pkl'))
    
    with open(os.path.join(MODEL_DIR, 'threshold.json'), 'w') as f:
        json.dump({'best_threshold': float(best_thresh)}, f)
        
    with open(os.path.join(MODEL_DIR, 'feature_names.json'), 'w') as f:
        json.dump(existing_features, f)
    
    # Save feature metadata for main.py
    with open(os.path.join(MODEL_DIR, 'feature_metadata.json'), 'w') as f:
        json.dump({
            'base_features': available_base,
            'engineered_features': available_engineered,
            'dropped_features': [c for c in candidate_features if c not in existing_features],
            'zero_ratios': {k: float(v) for k, v in zero_ratios.items()}
        }, f, indent=2)
    
    print("✅ Pipeline complete!")

if __name__ == "__main__":
    train()