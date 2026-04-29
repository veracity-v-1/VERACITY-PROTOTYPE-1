import pandas as pd
import numpy as np
import os
from train import load_dataset, DATA_DIR, BASE_FEATURE_COLS, ENGINEERED_FEATURE_COLS

files = sorted([f for f in os.listdir(DATA_DIR) if f.endswith(('.arff', '.csv'))])
all_dfs = []

print("="*60)
print("DATASET DIAGNOSTICS")
print("="*60)

for f in files:
    df = load_dataset(os.path.join(DATA_DIR, f))
    if df is not None:
        print(f"\n📁 {f}")
        print(f"   Rows: {len(df)} | Buggy: {df['target_label'].sum()} ({df['target_label'].mean()*100:.1f}%)")
        
        # Check which base features exist and their variance
        for col in ['cbo', 'rfc'] + BASE_FEATURE_COLS[:5]:  # Check CBO/RFC + sample others
            if col in df.columns:
                non_null = df[col].notna().sum()
                unique_vals = df[col].nunique()
                max_val = df[col].max()
                print(f"   {col}: non-null={non_null}, unique={unique_vals}, max={max_val:.2f}")
            else:
                print(f"   {col}: ❌ MISSING")
        all_dfs.append(df)

if all_dfs:
    merged = pd.concat(all_dfs, ignore_index=True)
    print(f"\n{'='*60}")
    print(f"MERGED SUMMARY: {len(merged)} total rows")
    print(f"Buggy rate: {merged['target_label'].mean()*100:.2f}%")
    
    print(f"\nCBO/RFC STATUS:")
    for col in ['cbo', 'rfc']:
        if col in merged.columns:
            non_zero = (merged[col] != 0).sum()
            print(f"   {col}: non-zero values = {non_zero}/{len(merged)} ({non_zero/len(merged)*100:.1f}%)")
        else:
            print(f"   {col}: ❌ NOT IN MERGED DATA")