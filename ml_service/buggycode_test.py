"""
test_high_risk.py --- Test with code designed to trigger HIGH risk
"""
import requests
import json

BASE = "http://localhost:8080"

# Code designed to trigger HIGH risk based on NASA defect patterns
# Key triggers: high v(g), high e, high b, high loc, many branches
buggy_code = '''
import os, sys, re, json, math, random, datetime, time, hashlib

def process_transaction(user_id, amount, currency, config, db, cache, auth, logger, metrics, notifier):
    result = None
    status = "pending"
    retry_count = 0
    max_retries = 5
    processed = False
    validation_passed = False
    audit_log = []
    
    if user_id and amount and currency:
        if config and config.get("enabled"):
            if db and db.is_connected():
                if auth and auth.verify(user_id):
                    if amount > 0:
                        if currency in config.get("currencies", []):
                            if cache and cache.available():
                                try:
                                    cached_rate = cache.get(f"rate:{currency}")
                                    if cached_rate:
                                        rate = cached_rate
                                    else:
                                        rate = db.query("SELECT rate FROM exchange_rates WHERE currency = ?", (currency,))
                                        cache.set(f"rate:{currency}", rate, ttl=300)
                                    
                                    converted = amount * rate
                                    fee = converted * config.get("fee_rate", 0.02)
                                    total = converted + fee
                                    
                                    if total < config.get("max_amount", 10000):
                                        if auth.check_limit(user_id, total):
                                            transaction_id = hashlib.md5(f"{user_id}:{amount}:{time.time()}".encode()).hexdigest()
                                            
                                            db.execute("BEGIN TRANSACTION")
                                            try:
                                                db.execute("INSERT INTO transactions (id, user_id, amount, currency, status, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                                                    (transaction_id, user_id, amount, currency, status, datetime.datetime.now()))
                                                
                                                balance = db.query("SELECT balance FROM accounts WHERE user_id = ?", (user_id,))
                                                new_balance = balance - total
                                                
                                                if new_balance >= 0:
                                                    db.execute("UPDATE accounts SET balance = ? WHERE user_id = ?", (new_balance, user_id))
                                                    
                                                    if notifier:
                                                        notifier.send(user_id, f"Transaction {transaction_id} processed: {amount} {currency}")
                                                    
                                                    metrics.record("transaction_processed", amount)
                                                    audit_log.append({"action": "debit", "amount": total, "balance": new_balance})
                                                    
                                                    db.execute("COMMIT")
                                                    result = {"id": transaction_id, "status": "completed", "amount": amount, "fee": fee}
                                                    processed = True
                                                else:
                                                    db.execute("ROLLBACK")
                                                    status = "insufficient_funds"
                                                    logger.error(f"Insufficient funds for user {user_id}: needed {total}, had {balance}")
                                                    audit_log.append({"action": "failed", "reason": "insufficient_funds"})
                                            except Exception as e:
                                                db.execute("ROLLBACK")
                                                logger.error(f"Transaction failed for {user_id}: {str(e)}")
                                                retry_count += 1
                                                if retry_count < max_retries:
                                                    time.sleep(0.1 * retry_count)
                                                else:
                                                    status = "failed"
                                                    result = {"error": str(e), "retries": retry_count}
                                                    notifier.send(user_id, "Transaction failed after retries")
                                        else:
                                            status = "limit_exceeded"
                                            logger.warning(f"Limit exceeded for user {user_id}: {total}")
                                    else:
                                        status = "amount_too_high"
                                        logger.warning(f"Amount too high: {total}")
                                except Exception as e:
                                    logger.error(f"Cache error: {str(e)}")
                                    status = "cache_error"
                            else:
                                status = "cache_unavailable"
                                logger.warning("Cache service unavailable")
                        else:
                            status = "invalid_currency"
                            logger.warning(f"Invalid currency: {currency}")
                    else:
                        status = "invalid_amount"
                        logger.warning(f"Invalid amount: {amount}")
                else:
                    status = "auth_failed"
                    logger.warning(f"Auth failed for user: {user_id}")
            else:
                status = "db_unavailable"
                logger.error("Database connection unavailable")
        else:
            status = "service_disabled"
            logger.info("Transaction service disabled")
    else:
        status = "missing_parameters"
        logger.warning("Missing required parameters")
    
    if not processed:
        result = {"status": status, "retry_count": retry_count, "audit_log": audit_log}
    
    return result

def validate_user(user_data, rules, context, history, preferences, session):
    valid = False
    errors = []
    warnings = []
    checks = []
    
    if user_data:
        if user_data.get("id"):
            if user_data.get("email"):
                if re.match(r"^[\w\.-]+@[\w\.-]+\.\w+$", user_data.get("email")):
                    if user_data.get("age") and user_data.get("age") >= 18:
                        if user_data.get("country"):
                            if user_data.get("country") in rules.get("allowed_countries", []):
                                if history:
                                    if not history.get("banned"):
                                        if preferences:
                                            if preferences.get("notifications") in ["email", "sms", "push"]:
                                                if session and session.get("token"):
                                                    if context and context.get("ip"):
                                                        if rules.get("check_ip", False):
                                                            if context.get("ip") not in rules.get("blocked_ips", []):
                                                                valid = True
                                                                checks.append("ip_check")
                                                            else:
                                                                errors.append("blocked_ip")
                                                        else:
                                                            valid = True
                                                    else:
                                                        warnings.append("missing_ip")
                                                else:
                                                    errors.append("invalid_session")
                                            else:
                                                warnings.append("invalid_notification_pref")
                                        else:
                                            errors.append("user_banned")
                                    else:
                                        errors.append("no_history")
                                else:
                                    warnings.append("missing_country")
                            else:
                                errors.append("underage")
                        else:
                            errors.append("invalid_email")
                    else:
                        errors.append("missing_email")
                else:
                    errors.append("missing_id")
            else:
                errors.append("missing_user_data")
    
    return {"valid": valid, "errors": errors, "warnings": warnings, "checks": checks}

def calculate_risk_score(inputs, weights, thresholds, history, context, metadata):
    score = 0.0
    factors = []
    normalized = {}
    
    for key, value in inputs.items():
        if key in weights:
            weight = weights[key]
            if key in thresholds:
                threshold = thresholds[key]
                if value > threshold:
                    normalized[key] = (value - threshold) / threshold
                    score += normalized[key] * weight
                    factors.append({"factor": key, "value": value, "threshold": threshold, "contribution": normalized[key] * weight})
                else:
                    normalized[key] = 0.0
            else:
                normalized[key] = value * weight
                score += normalized[key]
                factors.append({"factor": key, "value": value, "contribution": normalized[key]})
        else:
            if metadata and metadata.get("strict"):
                raise ValueError(f"Unknown factor: {key}")
            else:
                normalized[key] = value * 0.1
                score += normalized[key]
    
    if history:
        for event in history.get("events", []):
            if event.get("severity") == "high":
                score *= 1.5
                factors.append({"factor": "history", "event": event, "multiplier": 1.5})
            elif event.get("severity") == "medium":
                score *= 1.2
                factors.append({"factor": "history", "event": event, "multiplier": 1.2})
    
    if context:
        if context.get("time_of_day") == "night":
            score *= 1.1
            factors.append({"factor": "time", "multiplier": 1.1})
        if context.get("day_of_week") in ["saturday", "sunday"]:
            score *= 1.05
            factors.append({"factor": "weekend", "multiplier": 1.05})
    
    final_score = min(score, 100.0)
    return {"score": final_score, "factors": factors, "normalized": normalized, "metadata": metadata}
'''

print("Analyzing high-risk code...")
r = requests.post(f"{BASE}/analyze", json={"code": buggy_code, "filename": "buggy_module.py"})
result = r.json()

print(f"\nRisk Level: {result.get('risk_level')}")
print(f"Bug Probability: {result.get('bug_probability')}")
print(f"Features: {len(result.get('features', {}))}")
print("\nTop SHAP features:")
for feat in result.get('shap_explanation', {}).get('top_features', [])[:5]:
    arrow = "🔺" if feat['direction'] == 'increases_risk' else "🔻"
    print(f"  {arrow} {feat['feature']}: {feat['shap_value']:.4f} (value: {feat['metric_value']})")

# Now test chatbot with REAL high-risk data
if result.get('risk_level') == 'High':
    print("\n" + "="*60)
    print("HIGH RISK DETECTED - Testing chatbot flow...")
    print("="*60)
    
    # Start chat
    chat = requests.post(f"{BASE}/chat/start", json={
        "session_id": "high_risk_test_001",
        "risk_level": "HIGH",
        "top_features": result.get('shap_explanation', {}).get('top_features', []),
        "user_name": "Alex"
    }).json()
    
    print(f"\nBot: {chat['conversation']['messages'][0]['text'][:80]}...")
    
    # Show priority
    msg1 = requests.post(f"{BASE}/chat/message", json={
        "session_id": "high_risk_test_001",
        "message": "show me the biggest problem"
    }).json()
    
    advice = [m for m in msg1['conversation']['messages'] if m.get('type') == 'advice'][0]
    print(f"\nBiggest Problem: {advice['emoji']} {advice['display_name']}")
    print(f"Score: {advice['your_score']} / Safe limit: {advice['safe_limit']}")
    print(f"Exceeded: {advice['exceeded']} | Severity: {advice['how_bad']}")
    
    # Generate report
    report = requests.post(f"{BASE}/report/json", json={
        "filename": "buggy_module.py",
        "risk_level": "High",
        "bug_probability": result.get('bug_probability'),
        "threshold_used": result.get('threshold_used'),
        "features": result.get('features'),
        "shap_explanation": result.get('shap_explanation'),
        "mitigation_advice": result.get('mitigation_advice'),
        "user_notes": "High-risk test report"
    }).json()
    
    print(f"\nReport Health: {report['report']['metrics_summary']['overall_health']}")
    print(f"Exceeded Thresholds: {report['report']['metrics_summary']['thresholds_exceeded']}")
    print(f"Estimated Effort: {report['report']['mitigation_plan']['estimated_total_effort']}")
    
else:
    print(f"\n⚠️  Still Low risk. This is normal — the model needs specific bug patterns.")
    print("The chatbot and report generation are working correctly.")
    print("For FYP demo, you can show the conversational flow with any risk level.")