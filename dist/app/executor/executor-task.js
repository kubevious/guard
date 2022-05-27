"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExecutorTask = void 0;
var the_lodash_1 = __importDefault(require("the-lodash"));
var the_promise_1 = require("the-promise");
var Path = __importStar(require("path"));
var helper_logic_processor_1 = require("@kubevious/helper-logic-processor");
var state_registry_1 = require("@kubevious/state-registry");
var snapshot_1 = require("../reader/snapshot");
var persistable_snapshot_1 = require("./persistable-snapshot");
var data_models_1 = require("@kubevious/data-models");
var calculator_1 = require("../summary/calculator");
var types_1 = require("../summary/types");
var recent_base_snapshot_reader_1 = require("../reader/recent-base-snapshot-reader");
var ExecutorTask = /** @class */ (function () {
    function ExecutorTask(logger, context, target) {
        this._latestSnapshot = null;
        this._baseSnapshot = null;
        this._latestSummary = null;
        this._deltaSummary = null;
        this._baseDeltaSnapshots = [];
        this._finalPersistableSnapshot = null;
        this._latestSnapshotDelta = null;
        this._timelineSummary = null;
        this._snapshotDate = new Date();
        this._validationConfig = {};
        this._logicStoreItems = [];
        this._logger = logger;
        this._context = context;
        this._target = target;
        this._snapshotIdStr = data_models_1.BufferUtils.toStr(target.snapshotId);
        this.logger.info('snapshot: %s', this._snapshotIdStr);
    }
    Object.defineProperty(ExecutorTask.prototype, "logger", {
        get: function () {
            return this._logger;
        },
        enumerable: false,
        configurable: true
    });
    ExecutorTask.prototype.execute = function (tracker) {
        var _this = this;
        this.logger.info("[execute] Begin");
        return the_promise_1.Promise.resolve()
            .then(function () { return _this._queryValidatorConfig(tracker); })
            .then(function () { return _this._queryRules(tracker); })
            .then(function () { return _this._queryMarkers(tracker); })
            .then(function () { return _this._queryLogicStore(tracker); })
            .then(function () { return _this._executeLogicProcessor(tracker); })
            .then(function () { return _this._executeSnapshotProcessor(tracker); })
            .then(function () { return _this._queryBaseSnapshot(tracker); })
            .then(function () { return _this._checkBaseSnapshot(tracker); })
            .then(function () { return _this._processLatestDeltaSnapshot(tracker); })
            .then(function () { return _this._processBaseDeltaSnapshot(tracker); })
            .then(function () { return _this._producePersistableSnapshot(tracker); })
            .then(function () { return _this._calculateSummary(tracker); })
            .then(function () { return _this._notifyWebSocket(tracker); })
            .then(function () { });
    };
    ExecutorTask.prototype._queryValidatorConfig = function (tracker) {
        var _this = this;
        return tracker.scope("query-validator-config", function (innerTracker) {
            return _this._context.dataStore.table(_this._context.dataStore.validation.Validator)
                .queryMany({})
                .then(function (rows) {
                _this._validationConfig = the_lodash_1.default.makeDict(rows, function (x) { return x.validator_id; }, function (x) { return x.setting; });
            });
        });
    };
    ExecutorTask.prototype._queryRules = function (tracker) {
        var _this = this;
        return tracker.scope("query-rules", function (innerTracker) {
            return _this._context.dataStore.table(_this._context.dataStore.ruleEngine.Rules)
                .queryMany({ enabled: true })
                .then(function (rows) {
                _this._rules = rows.map(function (x) {
                    var rule = {
                        name: x.name,
                        hash: x.hash,
                        target: x.target,
                        script: x.script
                    };
                    return rule;
                });
            });
        });
    };
    ExecutorTask.prototype._queryMarkers = function (tracker) {
        var _this = this;
        return tracker.scope("query-markers", function (innerTracker) {
            return _this._context.dataStore.table(_this._context.dataStore.ruleEngine.Markers)
                .queryMany({})
                .then(function (rows) {
                _this._markers = rows.map(function (x) {
                    var marker = {
                        name: x.name
                    };
                    return marker;
                });
            });
        });
    };
    ExecutorTask.prototype._queryLogicStore = function (tracker) {
        var _this = this;
        return tracker.scope("query-logic-store", function (innerTracker) {
            return _this._context.dataStore.table(_this._context.dataStore.logicStore.LogicItemData)
                .queryMany({})
                .then(function (rows) {
                _this._logicStoreItems = rows.map(function (x) {
                    var item = {
                        dn: x.dn,
                        key: x.key,
                        value: x.value,
                    };
                    return item;
                });
            });
        });
    };
    ExecutorTask.prototype._executeLogicProcessor = function (tracker) {
        var _this = this;
        return tracker.scope("run-logic-processor", function (innerTracker) {
            var logicProcessor = new helper_logic_processor_1.LogicProcessor(_this.logger, innerTracker, _this._context.parserLoader, _this._target.registry, _this._validationConfig);
            logicProcessor.store.loadItems(_this._logicStoreItems);
            return logicProcessor.process()
                .then(function (registryState) {
                _this.logger.info("[_executeLogicProcessor] End. Node Count: %s", registryState.getNodes().length);
                _this._registryState = registryState;
                _this._logicStoreItems = logicProcessor.store.exportItems();
                // this.logger.info("LogicProcessor Complete.")
                // this.logger.info("RegistryState Item Count: %s", registryState.getCount());
            });
        });
    };
    ExecutorTask.prototype._executeSnapshotProcessor = function (tracker) {
        var _this = this;
        return tracker.scope("snapshot-processor", function (innerTracker) {
            return _this._context.snapshotProcessor.process(_this._registryState, _this._rules, innerTracker)
                .then(function (result) {
                _this.logger.info("SnapshotProcessor Complete.");
                _this.logger.info("SnapshotProcessor Count: %s", result.bundle.getCount());
                _this._targetBundleState = result.bundle;
                _this._targetSnapshot = _this._produceSnapshot(result.bundle);
                _this.logger.info("SnapshotProcessor Target Item Count: %s", _this._targetSnapshot.snapItemCount);
                _this.logger.info("SnapshotProcessor Target Partition: %s", _this._targetSnapshot.partitionId);
                _this._ruleEngineResult = result.ruleEngineResult;
                return the_promise_1.Promise.resolve()
                    .then(function () { return _this._outputFile("snapshot-processor-rules-engine-result.json", result.ruleEngineResult); })
                    .then(function () { return _this._outputFile("target-snapshot.json", _this._targetSnapshot.export()); });
            });
        });
    };
    ExecutorTask.prototype._queryBaseSnapshot = function (tracker) {
        var _this = this;
        return tracker.scope("query-base-snapshot", function (innerTracker) {
            var reader = new recent_base_snapshot_reader_1.RecentBaseSnapshotReader(_this.logger, _this._context);
            return reader.query()
                .then(function (result) {
                if (!result) {
                    _this.logger.info("[_queryBaseSnapshot] No Base Snapshot found.");
                }
                else {
                    _this._baseSnapshot = result.baseSnapshot;
                    _this._latestSnapshot = result.snapshot;
                    _this._latestSummary = result.summary;
                    if (_this._baseSnapshot) {
                        _this.logger.info("[_queryBaseSnapshot] Base Snapshot: %s, size: %s", data_models_1.BufferUtils.toStr(_this._baseSnapshot.snapshotId), _this._baseSnapshot.count);
                    }
                    _this.logger.info("[_queryBaseSnapshot] Latest Snapshot: %s, size: %s", data_models_1.BufferUtils.toStr(_this._latestSnapshot.snapshotId), _this._latestSnapshot.count);
                }
                if (!_this._latestSnapshot) {
                    _this._latestSnapshot = new snapshot_1.DBSnapshot(null, new Date());
                }
                if (!_this._latestSummary) {
                    _this._latestSummary = (0, types_1.newDeltaSummary)();
                }
            });
        });
    };
    ExecutorTask.prototype._checkBaseSnapshot = function (tracker) {
        var _this = this;
        if (this._baseSnapshot) {
            this.logger.info("BaseSnapshot Item Count: %s, Id: %s", this._baseSnapshot.count, data_models_1.BufferUtils.toStr(this._baseSnapshot.snapshotId));
        }
        else {
            this.logger.info("No BaseSnapshot");
        }
        if (!this._latestSnapshot) {
            throw new Error("Latest Snapshot Not Set");
        }
        return the_promise_1.Promise.resolve()
            .then(function () {
            if (_this._baseSnapshot) {
                return _this._outputFile("base-snapshot.json", _this._baseSnapshot.export());
            }
        })
            .then(function () {
            return _this._outputFile("latest-snapshot.json", _this._latestSnapshot.export());
        })
            .then(function () {
            return _this._outputFile("latest-summary.json", _this._latestSummary);
        });
    };
    ExecutorTask.prototype._processLatestDeltaSnapshot = function (tracker) {
        var _this = this;
        return tracker.scope("process-latest-delta-snapshot", function (innerTracker) {
            var deltaSnapshot = _this._produceDeltaSnapshot(_this._latestSnapshot);
            _this.logger.info("LatestDeltaSnapshot. Partition: %s", deltaSnapshot.partitionId);
            _this.logger.info("LatestDeltaSnapshot. SNAP ITEMS: %s", deltaSnapshot.snapItemCount);
            _this.logger.info("LatestDeltaSnapshot. DIFF ITEMS: %s", deltaSnapshot.diffItemCount);
            _this.logger.info("LatestDeltaSnapshot. DIFF ITEMS PRESENT: %s", deltaSnapshot.diffItems.filter(function (x) { return x.present; }).length);
            _this.logger.info("LatestDeltaSnapshot. DIFF ITEMS NOT PRESENT: %s", deltaSnapshot.diffItems.filter(function (x) { return !x.present; }).length);
            _this._latestSnapshotDelta = deltaSnapshot;
            return the_promise_1.Promise.resolve()
                .then(function () { return _this._outputFile("latest-delta-snapshot.json", deltaSnapshot.export()); });
        });
    };
    ExecutorTask.prototype._processBaseDeltaSnapshot = function (tracker) {
        var _this = this;
        return tracker.scope("process-base-delta-snapshot", function (innerTracker) {
            if (!_this._baseSnapshot) {
                if (_this._latestSnapshot.snapshotId) {
                    if (_this._targetSnapshot.partitionId === _this._latestSnapshotDelta.partitionId) {
                        _this._baseDeltaSnapshots.push({
                            deltaChangePerc: 0,
                            snapshot: _this._latestSnapshotDelta
                        });
                    }
                    else {
                        _this.logger.info("BaseDeltaSnapshot. Skipping latest snapshot because different partitionId.");
                    }
                }
                return;
            }
            if (_this._baseSnapshot.snapshotId == _this._latestSnapshot.snapshotId) {
                throw new Error("THIS SHOULD NOT HAPPEN.");
                return;
            }
            var deltaSnapshot = _this._produceDeltaSnapshot(_this._baseSnapshot);
            _this.logger.info("BaseDeltaSnapshot. Partition: %s", deltaSnapshot.partitionId);
            _this.logger.info("BaseDeltaSnapshot. SNAP ITEMS: %s", deltaSnapshot.snapItemCount);
            _this.logger.info("BaseDeltaSnapshot. DIFF ITEMS: %s", deltaSnapshot.diffItemCount);
            _this.logger.info("BaseDeltaSnapshot. DIFF ITEMS PRESENT: %s", deltaSnapshot.diffItems.filter(function (x) { return x.present; }).length);
            _this.logger.info("BaseDeltaSnapshot. DIFF ITEMS NOT PRESENT: %s", deltaSnapshot.diffItems.filter(function (x) { return !x.present; }).length);
            if (_this._targetSnapshot.partitionId === deltaSnapshot.partitionId) {
                _this._baseDeltaSnapshots.push({
                    deltaChangePerc: 0,
                    snapshot: deltaSnapshot
                });
            }
            else {
                _this.logger.info("BaseDeltaSnapshot. Skipping base snapshot because different partitionId.");
            }
            return the_promise_1.Promise.resolve()
                .then(function () { return _this._outputFile("base-delta-snapshot.json", deltaSnapshot.export()); });
        });
    };
    ExecutorTask.prototype._producePersistableSnapshot = function (tracker) {
        var _this = this;
        return tracker.scope("produce-persistable-snapshot", function (innerTracker) {
            for (var _i = 0, _a = _this._baseDeltaSnapshots; _i < _a.length; _i++) {
                var deltaInfo = _a[_i];
                deltaInfo.deltaChangePerc = _this._calculateDiffPercentage(deltaInfo.snapshot);
                var idStr = deltaInfo.snapshot.dbSnapshot.snapshotId ? data_models_1.BufferUtils.toStr(deltaInfo.snapshot.dbSnapshot.snapshotId) : 'NONE';
                _this.logger.info("DeltaSnapshot. ID: %s", idStr);
                _this.logger.info("DeltaSnapshot. deltaChangePerc: %s%%", deltaInfo.deltaChangePerc);
            }
            var deltaSnapshots = _this._baseDeltaSnapshots.filter(function (x) { return x.deltaChangePerc < 50; });
            var finalDeltaSnapshot = the_lodash_1.default.minBy(deltaSnapshots, function (x) { return x.deltaChangePerc; });
            var finalSnapshot;
            if (finalDeltaSnapshot) {
                _this.logger.info("DeltaSnapshot. Storing using diff snapshot. Percentage: %s%%", finalDeltaSnapshot.deltaChangePerc);
                finalSnapshot = finalDeltaSnapshot.snapshot;
                _this.logger.info("DeltaSnapshot. Storing using diff snapshot. BaseId: %s", data_models_1.BufferUtils.toStr(finalSnapshot.dbSnapshot.snapshotId));
            }
            else {
                _this.logger.info("DeltaSnapshot. Storing using new snapshot.");
                finalSnapshot = _this._targetSnapshot;
            }
            _this.logger.info("FinalSnapshot. SNAP ITEMS: %s", finalSnapshot.snapItemCount);
            _this.logger.info("FinalSnapshot. DIFF ITEMS: %s", finalSnapshot.diffItemCount);
            _this.logger.info("FinalSnapshot. DIFF ITEMS PRESENT: %s", finalSnapshot.diffItems.filter(function (x) { return x.present; }).length);
            _this.logger.info("FinalSnapshot. DIFF ITEMS NOT PRESENT: %s", finalSnapshot.diffItems.filter(function (x) { return !x.present; }).length);
            _this._finalPersistableSnapshot = finalSnapshot;
            return the_promise_1.Promise.resolve()
                .then(function () { return _this._outputFile("final-snapshot.json", finalSnapshot.export()); });
        });
    };
    ExecutorTask.prototype._calculateSummary = function (tracker) {
        var _this = this;
        return tracker.scope("calculate-summary", function (innerTracker) {
            var calculator = new calculator_1.SummaryCalculator(_this._logger, _this._targetSnapshot, _this._latestSnapshotDelta, _this._latestSummary);
            var summary = calculator.process();
            _this._deltaSummary = summary;
            _this._timelineSummary = calculator.timelineSummary;
            return the_promise_1.Promise.resolve()
                .then(function () { return _this._outputFile("delta-summary.json", _this._deltaSummary); });
        });
    };
    ExecutorTask.prototype._notifyWebSocket = function (tracker) {
        var _this = this;
        return tracker.scope("notify-websocket", function (innerTracker) {
            return _this._context.webSocketUpdater.notifyNewSnapshot();
        });
    };
    ExecutorTask.prototype._produceSnapshot = function (state) {
        var snapshot = new persistable_snapshot_1.PersistableSnapshot(this._target.snapshotId, state.date);
        this._logger.info("[_produceSnapshot] date: %s, count: %s", snapshot.date.toISOString(), state.getCount());
        for (var _i = 0, _a = state.nodeItems; _i < _a.length; _i++) {
            var node = _a[_i];
            {
                var configHash = snapshot.addConfig(node.config);
                snapshot.addItem({
                    config_kind: state_registry_1.SnapshotConfigKind.node,
                    dn: node.dn,
                    kind: node.kind,
                    config_hash: configHash
                });
                snapshot.addNodeConfig(node.dn, node.config);
            }
            {
                var childrenNodes = state.getChildren(node.dn);
                if (childrenNodes.length > 0) {
                    var childrenRns = childrenNodes.map(function (x) { return x.rn; });
                    childrenRns = childrenRns.sort();
                    var configHash = snapshot.addConfig(childrenRns);
                    snapshot.addItem({
                        config_kind: state_registry_1.SnapshotConfigKind.children,
                        dn: node.dn,
                        kind: node.kind,
                        config_hash: configHash
                    });
                }
            }
            {
                for (var _b = 0, _c = the_lodash_1.default.values(node.propertiesMap); _b < _c.length; _b++) {
                    var props = _c[_b];
                    var configHash = snapshot.addConfig(props);
                    snapshot.addItem({
                        config_kind: state_registry_1.SnapshotConfigKind.props,
                        dn: node.dn,
                        kind: node.kind,
                        name: props.id,
                        config_hash: configHash
                    });
                }
            }
            {
                if (node.selfAlerts.length > 0) {
                    var configHash = snapshot.addConfig(node.selfAlerts);
                    snapshot.addItem({
                        config_kind: state_registry_1.SnapshotConfigKind.alerts,
                        dn: node.dn,
                        kind: node.kind,
                        config_hash: configHash
                    });
                }
            }
        }
        return snapshot;
    };
    ExecutorTask.prototype._produceDeltaSnapshot = function (sourceSnapshot) {
        if (sourceSnapshot.snapshotId) {
            this._logger.info('[_produceDeltaSnapshot] Begin, SourceID: %s', data_models_1.BufferUtils.toStr(sourceSnapshot.snapshotId));
        }
        else {
            this._logger.info('[_produceDeltaSnapshot] Begin, No SourceID.');
        }
        var targetDbSnapshot = this._targetSnapshot.dbSnapshot;
        var diffSnapshot = this._targetSnapshot.constructDiff(sourceSnapshot.snapshotId);
        this._logger.info('[_produceDeltaSnapshot] baseSnapshot size: %s', sourceSnapshot.count);
        this._logger.info('[_produceDeltaSnapshot] targetDbSnapshot size: %s', targetDbSnapshot.count);
        for (var _i = 0, _a = targetDbSnapshot.keys; _i < _a.length; _i++) {
            var key = _a[_i];
            var item = targetDbSnapshot.findById(key);
            var baseItem = sourceSnapshot.findById(key);
            if (baseItem) {
                if (!data_models_1.BufferUtils.areEqual(item.config_hash, baseItem.config_hash)) {
                    diffSnapshot.addDiffItem({
                        dn: item.dn,
                        kind: item.kind,
                        config_kind: item.config_kind,
                        name: item.name,
                        config_hash: item.config_hash,
                        present: true
                    });
                }
            }
            else {
                diffSnapshot.addDiffItem({
                    dn: item.dn,
                    kind: item.kind,
                    config_kind: item.config_kind,
                    name: item.name,
                    config_hash: item.config_hash,
                    present: true
                });
            }
        }
        for (var _b = 0, _c = sourceSnapshot.keys; _b < _c.length; _b++) {
            var key = _c[_b];
            var item = targetDbSnapshot.findById(key);
            if (!item) {
                var baseItem = sourceSnapshot.findById(key);
                diffSnapshot.addDiffItem({
                    dn: baseItem.dn,
                    kind: baseItem.kind,
                    config_kind: baseItem.config_kind,
                    name: baseItem.name,
                    present: false
                });
            }
        }
        return diffSnapshot;
    };
    ExecutorTask.prototype._calculateDiffPercentage = function (deltaSnapshot) {
        if (!deltaSnapshot.dbSnapshot.snapshotId) {
            return 0;
        }
        if (this._targetSnapshot.snapItemCount == 0) {
            return 0;
        }
        return Math.round(deltaSnapshot.diffItemCount * 100 / this._targetSnapshot.snapItemCount);
    };
    ExecutorTask.prototype._outputFile = function (fileName, contents) {
        var filePath = Path.join("snapshot-".concat(this._snapshotIdStr), fileName);
        return this.logger.outputFile(filePath, contents);
    };
    return ExecutorTask;
}());
exports.ExecutorTask = ExecutorTask;
//# sourceMappingURL=executor-task.js.map