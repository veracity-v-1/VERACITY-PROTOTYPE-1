import requests
import json

def analyze_and_show(code, name):
    print(f"\n{'='*60}")
    print(f"ANALYZING: {name}")
    print('='*60)
    
    r = requests.post('http://localhost:8080/analyze', 
                      json={'code': code, 'filename': 'test.py'})
    d = r.json()
    
    print(f"Risk Level: {d['risk_level']}")
    print(f"Bug Probability: {d['bug_probability']:.4f}")
    print(f"Threshold: {d['threshold_used']}")
    
    # Show key metrics that drive risk
    m = d['metrics']
    print(f"\nKey Metrics:")
    print(f"  LOC: {m.get('loc', 0)}")
    print(f"  v(g): {m.get('v(g)', 0)}")
    print(f"  ev(g): {m.get('ev(g)', 0)}")
    print(f"  branchcount: {m.get('branchcount', 0)}")
    print(f"  v: {m.get('v', 0)}")
    print(f"  e: {m.get('e', 0)}")
    print(f"  b: {m.get('b', 0)}")
    print(f"  v_density: {m.get('v_density', 0):.4f}")
    
    # Show SHAP top drivers
    print(f"\nTop Risk Drivers:")
    for feat in d['shap_explanation']['top_features'][:3]:
        print(f"  {feat['feature']}: {feat['shap_value']:.4f} ({feat['direction']})")

# Test 1: Simple code
analyze_and_show('def hello(): return 1', "Simple")

# Test 2: Your previous extreme code
extreme = '''
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
        for idx, item in enumerate(items):
            if not item:
                continue
            if not self.validate_item(item):
                continue
            transformed = self.transform_item(item, options)
            if transformed.get('priority') == 'high':
                if self.check_thresholds(transformed, context):
                    if self.db and self.db.is_connected():
                        db_result = self.db.insert(transformed)
                        results.append(db_result)
            elif transformed.get('priority') == 'medium':
                if options.get('process_medium'):
                    results.append(self.handle_medium_priority(transformed, context))
            else:
                self.stats['skipped'] += 1
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
'''
analyze_and_show(extreme, "Previous 'Extreme'")

# Test 3: TRULY pathological code
pathological = '''
import os
import sys
import json
import hashlib
import random
import string
import re
import datetime
import time
import math
import statistics
import itertools
import collections
import functools
import inspect
import types
import warnings
import traceback
import logging
import threading
import multiprocessing
import subprocess
import pathlib
import urllib
import base64
import binascii
import csv
import io
import pickle
import copy
import decimal
import fractions
import numbers
import typing
import enum
import dataclasses
import abc
import weakref

class UltimateSystemManager:
    def __init__(self, config, database, cache, queue, logger, metrics, alerts, backup, audit, crypto, mail, sms, push, webhook, scheduler, searcher, indexer, parser, renderer, exporter, importer, validator, sanitizer, transformer, aggregator, splitter, merger, compressor, encryptor, decryptor, signer, verifier, hasher, encoder, decoder, serializer, deserializer, builder, destroyer, creator, remover, updater, finder, checker, fixer, optimizer, analyzer, predictor, recommender, classifier, clusterer, ranker, scorer, grader, tester, debugger, profiler, monitor, watcher, listener, speaker, reader, writer, copier, mover, linker, mapper, reducer, filterer, sorter, searcher, replacer, inserter, deleter, selector, joiner, grouper, ungrouper, flattener, nester, reverser, shuffler, sampler, splitter, merger, combiner, separator, extractor, injector, ejector, collector, distributor, broadcaster, multicaster, unicaster, anycaster, allcaster, nonecaster, somecaster, everycaster, eachcaster, nocaster, onecaster, twocaster, threecaster, fourcaster, fivecaster, sixcaster, sevencaster, eightcaster, ninecaster, tencaster):
        self.config = config
        self.database = database
        self.cache = cache
        self.queue = queue
        self.logger = logger
        self.metrics = metrics
        self.alerts = alerts
        self.backup = backup
        self.audit = audit
        self.crypto = crypto
        self.mail = mail
        self.sms = sms
        self.push = push
        self.webhook = webhook
        self.scheduler = scheduler
        self.searcher = searcher
        self.indexer = indexer
        self.parser = parser
        self.renderer = renderer
        self.exporter = exporter
        self.importer = importer
        self.validator = validator
        self.sanitizer = sanitizer
        self.transformer = transformer
        self.aggregator = aggregator
        self.splitter = splitter
        self.merger = merger
        self.compressor = compressor
        self.encryptor = encryptor
        self.decryptor = decryptor
        self.signer = signer
        self.verifier = verifier
        self.hasher = hasher
        self.encoder = encoder
        self.decoder = decoder
        self.serializer = serializer
        self.deserializer = deserializer
        self.builder = builder
        self.destroyer = destroyer
        self.creator = creator
        self.remover = remover
        self.updater = updater
        self.finder = finder
        self.checker = checker
        self.fixer = fixer
        self.optimizer = optimizer
        self.analyzer = analyzer
        self.predictor = predictor
        self.recommender = recommender
        self.classifier = classifier
        self.clusterer = clusterer
        self.ranker = ranker
        self.scorer = scorer
        self.grader = grader
        self.tester = tester
        self.debugger = debugger
        self.profiler = profiler
        self.monitor = monitor
        self.watcher = watcher
        self.listener = listener
        self.speaker = speaker
        self.reader = reader
        self.writer = writer
        self.copier = copier
        self.mover = mover
        self.linker = linker
        self.mapper = mapper
        self.reducer = reducer
        self.filterer = filterer
        self.sorter = sorter
        self.searcher = searcher
        self.replacer = replacer
        self.inserter = inserter
        self.deleter = deleter
        self.selector = selector
        self.joiner = joiner
        self.grouper = grouper
        self.ungrouper = ungrouper
        self.flattener = flattener
        self.nester = nester
        self.reverser = reverser
        self.shuffler = shuffler
        self.sampler = sampler
        self.splitter = splitter
        self.merger = merger
        self.combiner = combiner
        self.separator = separator
        self.extractor = extractor
        self.injector = injector
        self.ejector = ejector
        self.collector = collector
        self.distributor = distributor
        self.broadcaster = broadcaster
        self.multicaster = multicaster
        self.unicaster = unicaster
        self.anycaster = anycaster
        self.allcaster = allcaster
        self.nonecaster = nonecaster
        self.somecaster = somecaster
        self.everycaster = everycaster
        self.eachcaster = eachcaster
        self.nocaster = nocaster
        self.onecaster = onecaster
        self.twocaster = twocaster
        self.threecaster = threecaster
        self.fourcaster = fourcaster
        self.fivecaster = fivecaster
        self.sixcaster = sixcaster
        self.sevencaster = sevencaster
        self.eightcaster = eightcaster
        self.ninecaster = ninecaster
        self.tencaster = tencaster

    def process_everything(self, data, options=None, flags=None, context=None, metadata=None, extras=None, overrides=None, injections=None, extractions=None, transformations=None, validations=None, sanitizations=None, aggregations=None, splittings=None, mergings=None, compressions=None, encryptions=None, decryptions=None, signings=None, verifications=None, hashings=None, encodings=None, decodings=None, serializations=None, deserializations=None, buildings=None, destructions=None, creations=None, removals=None, updatings=None, findings=None, checkings=None, fixings=None, optimizations=None, analyzations=None, predictions=None, recommendations=None, classifications=None, clusterings=None, rankings=None, scorings=None, gradings=None, testings=None, debuggings=None, profilings=None, monitorings=None, watchings=None, listenings=None, speakings=None, readings=None, writings=None, copyings=None, movings=None, linkings=None, mappings=None, reductions=None, filterings=None, sortings=None, searchings=None, replacings=None, insertings=None, deletings=None, selections=None, joinings=None, groupings=None, ungroupings=None, flattenings=None, nestings=None, reversings=None, shufflings=None, samplings=None, splittings2=None, mergings2=None, combinatings=None, separations=None, extractings=None, injectings=None, ejectings=None, collectings=None, distributions=None, broadcastings=None, multicastings=None, unicastings=None, anycastings=None, allcastings=None, nonecastings=None, somecastings=None, everycastings=None, eachcastings=None, nocastings=None, onecastings=None, twocastings=None, threecastings=None, fourcastings=None, fivecastings=None, sixcastings=None, sevencastings=None, eightcastings=None, ninecastings=None, tencastings=None):
        if options is None:
            options = {}
        if flags is None:
            flags = {}
        if context is None:
            context = {}
        if metadata is None:
            metadata = {}
        if extras is None:
            extras = {}
        if overrides is None:
            overrides = {}
        if injections is None:
            injections = {}
        if extractions is None:
            extractions = {}
        if transformations is None:
            transformations = {}
        if validations is None:
            validations = {}
        if sanitizations is None:
            sanitizations = {}
        if aggregations is None:
            aggregations = {}
        if splittings is None:
            splittings = {}
        if mergings is None:
            mergings = {}
        if compressions is None:
            compressions = {}
        if encryptions is None:
            encryptions = {}
        if decryptions is None:
            decryptions = {}
        if signings is None:
            signings = {}
        if verifications is None:
            verifications = {}
        if hashings is None:
            hashings = {}
        if encodings is None:
            encodings = {}
        if decodings is None:
            decodings = {}
        if serializations is None:
            serializations = {}
        if deserializations is None:
            deserializations = {}
        if buildings is None:
            buildings = {}
        if destructions is None:
            destructions = {}
        if creations is None:
            creations = {}
        if removals is None:
            removals = {}
        if updatings is None:
            updatings = {}
        if findings is None:
            findings = {}
        if checkings is None:
            checkings = {}
        if fixings is None:
            fixings = {}
        if optimizations is None:
            optimizations = {}
        if analyzations is None:
            analyzations = {}
        if predictions is None:
            predictions = {}
        if recommendations is None:
            recommendations = {}
        if classifications is None:
            classifications = {}
        if clusterings is None:
            clusterings = {}
        if rankings is None:
            rankings = {}
        if scorings is None:
            scorings = {}
        if gradings is None:
            gradings = {}
        if testings is None:
            testings = {}
        if debuggings is None:
            debuggings = {}
        if profilings is None:
            profilings = {}
        if monitorings is None:
            monitorings = {}
        if watchings is None:
            watchings = {}
        if listenings is None:
            listenings = {}
        if speakings is None:
            speakings = {}
        if readings is None:
            readings = {}
        if writings is None:
            writings = {}
        if copyings is None:
            copyings = {}
        if movings is None:
            movings = {}
        if linkings is None:
            linkings = {}
        if mappings is None:
            mappings = {}
        if reductions is None:
            reductions = {}
        if filterings is None:
            filterings = {}
        if sortings is None:
            sortings = {}
        if searchings is None:
            searchings = {}
        if replacings is None:
            replacings = {}
        if insertings is None:
            insertings = {}
        if deletings is None:
            deletings = {}
        if selections is None:
            selections = {}
        if joinings is None:
            joinings = {}
        if groupings is None:
            groupings = {}
        if ungroupings is None:
            ungroupings = {}
        if flattenings is None:
            flattenings = {}
        if nestings is None:
            nestings = {}
        if reversings is None:
            reversings = {}
        if shufflings is None:
            shufflings = {}
        if samplings is None:
            samplings = {}
        if splittings2 is None:
            splittings2 = {}
        if mergings2 is None:
            mergings2 = {}
        if combinatings is None:
            combinatings = {}
        if separations is None:
            separations = {}
        if extractings is None:
            extractings = {}
        if injectings is None:
            injectings = {}
        if ejectings is None:
            ejectings = {}
        if collectings is None:
            collectings = {}
        if distributions is None:
            distributions = {}
        if broadcastings is None:
            broadcastings = {}
        if multicastings is None:
            multicastings = {}
        if unicastings is None:
            unicastings = {}
        if anycastings is None:
            anycastings = {}
        if allcastings is None:
            allcastings = {}
        if nonecastings is None:
            nonecastings = {}
        if somecastings is None:
            somecastings = {}
        if everycastings is None:
            everycastings = {}
        if eachcastings is None:
            eachcastings = {}
        if nocastings is None:
            nocastings = {}
        if onecastings is None:
            onecastings = {}
        if twocastings is None:
            twocastings = {}
        if threecastings is None:
            threecastings = {}
        if fourcastings is None:
            fourcastings = {}
        if fivecastings is None:
            fivecastings = {}
        if sixcastings is None:
            sixcastings = {}
        if sevencastings is None:
            sevencastings = {}
        if eightcastings is None:
            eightcastings = {}
        if ninecastings is None:
            ninecastings = {}
        if tencastings is None:
            tencastings = {}
        return None
'''
analyze_and_show(pathological, "TRULY Pathological")