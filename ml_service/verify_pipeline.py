#!/usr/bin/env python3
"""
verify_pipeline.py --- Integration tests for Project Veracity ML API
"""
import requests
import sys

BASE_URL = "http://localhost:8080"

def test_health():
    print("=" * 50 + "\nTEST 1: Health Check\n" + "=" * 50)
    try:
        r = requests.get(f"{BASE_URL}/health", timeout=5)
        data = r.json()
        assert r.status_code == 200
        assert data["status"] == "healthy"
        assert data["model_loaded"] == True
        print(f"✅ Features: {data['feature_count']} | Threshold: {data['threshold']:.4f}")
        return True
    except Exception as e:
        print(f"❌ FAILED: {e}")
        return False

def test_low_risk():
    print("\n" + "=" * 50 + "\nTEST 2: Low-Risk Code\n" + "=" * 50)
    clean_code = 'def greet(name):\n    return f"Hello, {name}!"'
    try:
        r = requests.post(f"{BASE_URL}/analyze", json={"code": clean_code, "filename": "clean.py"}, timeout=10)
        data = r.json()
        assert r.status_code == 200
        assert data["risk_level"] == "Low"
        assert data["bug_probability"] < 0.6
        print(f"✅ Risk: {data['risk_level']} | Prob: {data['bug_probability']:.4f}")
        print(f"✅ Features: {len(data['features'])} | Advice msgs: {len(data['mitigation_advice']['messages'])}")
        return True
    except Exception as e:
        print(f"❌ FAILED: {e}")
        return False

def test_high_risk():
    print("\n" + "=" * 50 + "\nTEST 3: High-Risk Code\n" + "=" * 50)
    # More complex code to trigger high probability
    complex_code = '''
import os, sys, re, json

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
                                        processed = db.query(
                                            "INSERT INTO transaction_logs (user_id, amount, currency, status, timestamp) VALUES (?, ?, ?, ?, ?)",
                                            (item['user_id'], item['amount'], item['currency'], 'completed', datetime.now())
                                        )
                                        cache.set(f"user:{item['user_id']}:last_tx", processed, ttl=3600)
                                        results.append(processed)
                                        logger.info(f"Processed premium transaction for user {item['user_id']} with amount {item['amount']}")
                                    except DatabaseError as e:
                                        logger.error(f"DB error for user {item['user_id']}: {str(e)}")
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
                            raise ConnectionError(f"Database connection unavailable at {datetime.now()}")
                    else:
                        continue
                elif item.get('type') == 'basic':
                    if config.get('basic_enabled'):
                        results.append({'id': item['id'], 'status': 'basic', 'processed_at': datetime.now()})
                    else:
                        errors.append({'id': item['id'], 'reason': 'basic_disabled'})
                elif item.get('type') == 'enterprise':
                    if config.get('enterprise_enabled') and auth.check_role(item['user_id'], 'enterprise'):
                        if item.get('contract_id') and item.get('sla_level'):
                            processed = db.query(
                                "INSERT INTO enterprise_logs VALUES (?, ?, ?, ?)",
                                (item['contract_id'], item['user_id'], item['sla_level'], json.dumps(item['metadata']))
                            )
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
    try:
        r = requests.post(f"{BASE_URL}/analyze", json={"code": complex_code, "filename": "complex.py"}, timeout=10)
        data = r.json()
        assert r.status_code == 200
        assert "risk_level" in data
        assert "bug_probability" in data
        print(f"✅ Risk: {data['risk_level']} | Prob: {data['bug_probability']:.4f}")
        for feat in data['shap_explanation']['top_features'][:3]:
            arrow = "🔺" if feat['direction'] == 'increases_risk' else "🔻"
            print(f"   {arrow} {feat['feature']}: {feat['shap_value']:.4f}")
        return True
    except Exception as e:
        print(f"❌ FAILED: {e}")
        return False

def test_file_upload():
    print("\n" + "=" * 50 + "\nTEST 4: File Upload\n" + "=" * 50)
    try:
        import io
        file_content = b"def hello():\n    print('world')"
        r = requests.post(f"{BASE_URL}/analyze-file", files={"file": ("test.py", io.BytesIO(file_content), "text/plain")}, timeout=10)
        data = r.json()
        assert r.status_code == 200
        assert "risk_level" in data
        print(f"✅ Upload works | Risk: {data['risk_level']}")
        return True
    except Exception as e:
        print(f"❌ FAILED: {e}")
        return False

def test_errors():
    print("\n" + "=" * 50 + "\nTEST 5: Error Handling\n" + "=" * 50)
    passed = 0
    
    # Empty code
    try:
        r = requests.post(f"{BASE_URL}/analyze", json={"code": "", "filename": "empty.py"})
        assert r.status_code in (400, 422)
        print("✅ Empty code rejected")
        passed += 1
    except Exception as e:
        print(f"⚠️  Empty code: {e}")
    
    # Syntax error
    try:
        r = requests.post(f"{BASE_URL}/analyze", json={"code": "def broken(:\n    pass", "filename": "bad.py"})
        assert r.status_code in (400, 422)
        print("✅ Syntax error caught")
        passed += 1
    except Exception as e:
        print(f"⚠️  Syntax error: {e}")
    
    return passed >= 1

def main():
    print("PROJECT VERACITY - PIPELINE VERIFICATION")
    tests = [("Health", test_health), ("Low Risk", test_low_risk), 
             ("High Risk", test_high_risk), ("File Upload", test_file_upload),
             ("Errors", test_errors)]
    results = []
    for name, fn in tests:
        try:
            results.append((name, fn()))
        except Exception as e:
            print(f"\n❌ {name} CRASHED: {e}")
            results.append((name, False))
    
    passed = sum(1 for _, p in results if p)
    print(f"\n{'='*50}\nRESULT: {passed}/{len(results)} passed")
    if passed == len(results):
        print("🎉 ALL TESTS PASSED")
        return 0
    return 1

if __name__ == "__main__":
    sys.exit(main())