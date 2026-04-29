import requests
import json
import sys

BASE_URL = "http://localhost:8080"

CLEAN_CODE = '''
def greet(name):
    return f"Hello, {name}!"

def add(a, b):
    return a + b
'''

EXTREME_CODE = '''
import random
import string
import hashlib
import json
import os
from datetime import datetime, timedelta

class MegaProcessor:
    def __init__(self, config_path, db_connection, cache_pool, logger_instance, metrics_collector, alert_manager, backup_service, notification_queue, audit_trail, encryption_engine):
        self.config = self.load_config(config_path)
        self.db = db_connection
        self.cache = cache_pool
        self.logger = logger_instance
        self.metrics = metrics_collector
        self.alerts = alert_manager
        self.backup = backup_service
        self.notifications = notification_queue
        self.audit = audit_trail
        self.crypto = encryption_engine
        self.state = {}
        self.history = []
        self.errors = []
        self.warnings = []
        self.stats = {'processed': 0, 'failed': 0, 'skipped': 0, 'retried': 0}
        
    def load_config(self, path):
        if not os.path.exists(path):
            raise FileNotFoundError(f"Config not found: {path}")
        with open(path, 'r') as f:
            return json.load(f)
    
    def process_batch(self, items, options=None, flags=None, context=None, metadata=None):
        if options is None:
            options = {}
        if flags is None:
            flags = {}
        if context is None:
            context = {}
        if metadata is None:
            metadata = {}
            
        results = []
        temp_storage = {}
        validation_queue = []
        
        for idx, item in enumerate(items):
            if not item:
                self.warnings.append(f"Empty item at index {idx}")
                self.stats['skipped'] += 1
                continue
                
            if not self.validate_item(item):
                self.errors.append(f"Validation failed for item {idx}")
                self.stats['failed'] += 1
                if flags.get('strict'):
                    raise ValueError(f"Strict mode: item {idx} invalid")
                continue
            
            try:
                transformed = self.transform_item(item, options)
                
                if transformed.get('priority') == 'high':
                    if self.check_thresholds(transformed, context):
                        if self.db and self.db.is_connected():
                            if transformed.get('encrypted'):
                                payload = self.crypto.encrypt(json.dumps(transformed))
                            else:
                                payload = transformed
                                
                            if options.get('use_cache'):
                                cache_key = f"item:{transformed['id']}"
                                if self.cache.exists(cache_key):
                                    cached = self.cache.get(cache_key)
                                    if cached['timestamp'] > datetime.now() - timedelta(hours=1):
                                        results.append(cached)
                                        self.stats['skipped'] += 1
                                        continue
                            
                            db_result = self.db.insert(payload)
                            self.stats['processed'] += 1
                            
                            if db_result and options.get('backup'):
                                self.backup.save(payload)
                            
                            if db_result and flags.get('notify'):
                                self.notifications.send({
                                    'type': 'item_processed',
                                    'id': transformed['id'],
                                    'status': 'success'
                                })
                            
                            if metadata and metadata.get('audit'):
                                self.audit.record({
                                    'action': 'process',
                                    'item_id': transformed['id'],
                                    'user': context.get('user'),
                                    'result': 'success'
                                })
                            
                            results.append(db_result)
                        else:
                            self.warnings.append(f"DB disconnected for item {idx}")
                            if flags.get('queue_on_failure'):
                                validation_queue.append(transformed)
                            self.stats['retried'] += 1
                    else:
                        self.warnings.append(f"Threshold check failed for item {idx}")
                        temp_storage[idx] = transformed
                elif transformed.get('priority') == 'medium':
                    if options.get('process_medium'):
                        medium_result = self.handle_medium_priority(transformed, context)
                        if medium_result:
                            results.append(medium_result)
                            self.stats['processed'] += 1
                        else:
                            self.stats['skipped'] += 1
                    else:
                        self.stats['skipped'] += 1
                else:
                    self.stats['skipped'] += 1
                    
            except Exception as e:
                self.errors.append(f"Exception processing item {idx}: {str(e)}")
                self.stats['failed'] += 1
                if flags.get('abort_on_error'):
                    raise
                continue
        
        if validation_queue and self.db and self.db.is_connected():
            for queued_item in validation_queue:
                retry_result = self.retry_processing(queued_item, options, context)
                if retry_result:
                    results.append(retry_result)
                    self.stats['processed'] += 1
        
        return results
    
    def validate_item(self, item):
        if not isinstance(item, dict):
            return False
        if 'id' not in item:
            return False
        if 'priority' not in item:
            return False
        return True
    
    def transform_item(self, item, options):
        transformed = dict(item)
        if options.get('normalize'):
            transformed['id'] = str(transformed['id']).lower().strip()
        if options.get('hash_sensitive') and 'email' in transformed:
            transformed['email_hash'] = hashlib.sha256(transformed['email'].encode()).hexdigest()
            del transformed['email']
        if options.get('add_timestamp'):
            transformed['processed_at'] = datetime.now().isoformat()
        return transformed
    
    def check_thresholds(self, item, context):
        if context.get('bypass_thresholds'):
            return True
        if item.get('priority') == 'critical':
            return True
        if item.get('score', 0) > context.get('min_score', 0):
            return True
        return False
    
    def handle_medium_priority(self, item, context):
        if not self.db:
            return None
        return {'status': 'processed', 'item': item}
    
    def retry_processing(self, item, options, context):
        if not self.validate_item(item):
            return None
        transformed = self.transform_item(item, options)
        if self.check_thresholds(transformed, context):
            if self.db and self.db.is_connected():
                return self.db.insert(transformed)
        return None
'''

def test_health():
    print("="*50)
    print("TEST 1: Health Check")
    try:
        r = requests.get(f"{BASE_URL}/health", timeout=5)
        d = r.json()
        print(f"Status: {d['status']}")
        print(f"Features: {d['feature_count']}")
        assert d['feature_count'] == 36
        print("PASSED\n")
        return True
    except Exception as e:
        print(f"FAILED: {e}\n")
        return False

def test_code(name, code, should_be):
    print(f"TEST: {name}")
    try:
        r = requests.post(f"{BASE_URL}/analyze", json={"code": code, "filename": "test.py"}, timeout=15)
        d = r.json()
        print(f"  Risk: {d['risk_level']} | Probability: {d['bug_probability']:.4f}")
        
        if should_be == "LOW":
            assert d['risk_level'] == "LOW", f"Expected LOW, got {d['risk_level']}"
        elif should_be == "HIGH":
            assert d['risk_level'] == "HIGH", f"Expected HIGH, got {d['risk_level']}"
        
        print("  PASSED\n")
        return True
    except Exception as e:
        print(f"  FAILED: {e}\n")
        return False

def main():
    print("PROJECT VERACITY - PIPELINE TEST\n")
    results = [
        ("Health", test_health()),
        ("Clean Code", test_code("Clean Code", CLEAN_CODE, "LOW")),
        ("Extreme Code", test_code("Extreme Code", EXTREME_CODE, "HIGH")),
    ]
    
    passed = sum(1 for _, p in results if p)
    print(f"Total: {passed}/{len(results)} passed")
    
    if passed == len(results):
        print("\nYour pipeline works. Professor can test any file.")
    else:
        print("\nSomething is broken. Check server is running on port 8080.")

if __name__ == "__main__":
    main()