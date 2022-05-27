"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Collector = void 0;
var the_lodash_1 = __importDefault(require("the-lodash"));
var the_promise_1 = require("the-promise");
var moment_1 = __importDefault(require("moment"));
var data_models_1 = require("@kubevious/data-models");
var helper_logic_processor_1 = require("@kubevious/helper-logic-processor");
var data_models_2 = require("@kubevious/data-models");
var registry_1 = require("../concrete/registry");
var SNAPSHOT_QUEUE_SIZE = 5;
var DEFAULT_REPORTING_DELAY_SECONDS = moment_1.default.duration(5, 'minute').asSeconds();
var Collector = /** @class */ (function () {
    function Collector(context) {
        this._snapshots = {};
        this._snapshotsToProcess = {};
        this._currentMetric = null;
        this._latestMetric = null;
        this._recentDurations = [];
        this._configHashes = {};
        this._lastReportDate = null;
        this._context = context;
        this._logger = context.logger.sublogger("Collector");
        this.logger.info("[constructed] ");
        if (process.env.COLLECTOR_REPORT_DELAY_SEC) {
            this._reportingDelay = parseInt(process.env.COLLECTOR_REPORT_DELAY_SEC);
        }
        else {
            this._reportingDelay = DEFAULT_REPORTING_DELAY_SECONDS;
        }
        this._counters = {
            newSnapshotCount: 0,
            activateSnapshotCount: 0,
            itemsReportCount: 0,
            reportConfigCount: 0,
        };
    }
    Object.defineProperty(Collector.prototype, "logger", {
        get: function () {
            return this._logger;
        },
        enumerable: false,
        configurable: true
    });
    Collector.prototype.newSnapshot = function (date, agentVersion, baseSnapshotId) {
        var _this = this;
        this._agentVersion = agentVersion;
        var canAccept = this._canAcceptNewSnapshot();
        if (!canAccept.success) {
            var delaySeconds = canAccept.delaySec || 60;
            this.logger.info("Postponing reporting for %s seconds", delaySeconds);
            return {
                delay: true,
                delaySeconds: delaySeconds
            };
        }
        var metric = this._newMetric(date, 'snapshot');
        var item_hashes = {};
        if (baseSnapshotId) {
            var baseSnapshot = this._snapshots[baseSnapshotId];
            if (baseSnapshot) {
                item_hashes = the_lodash_1.default.clone(baseSnapshot.item_hashes);
            }
            else {
                return RESPONSE_NEED_NEW_SNAPSHOT;
            }
        }
        var id = data_models_2.UuidUtils.newDatedUUID();
        var snapshotInfo = {
            id: id,
            reportDate: new Date(),
            date: date,
            agentVersion: agentVersion,
            metric: metric,
            item_hashes: item_hashes
        };
        this._snapshots[id] = snapshotInfo;
        this._lastReportDate = (0, moment_1.default)();
        return the_promise_1.Promise.resolve()
            .then(function () {
            var reportingInfo = {
                snapshot_id: snapshotInfo.id,
                date: snapshotInfo.date.toISOString(),
                agent_version: snapshotInfo.agentVersion,
            };
            return _this._context.configAccessor.setCollectorReportingInfo(reportingInfo);
        })
            .then(function () {
            _this._counters.newSnapshotCount++;
        })
            .then(function () {
            return _this._context.webSocketUpdater.notifyReporter();
        })
            .then(function () {
            return {
                id: id
            };
        });
    };
    Collector.prototype.acceptSnapshotItems = function (snapshotId, items) {
        var _this = this;
        var snapshotInfo = this._snapshots[snapshotId];
        if (!snapshotInfo) {
            return RESPONSE_NEED_NEW_SNAPSHOT;
        }
        var missingHashes = [];
        for (var _i = 0, items_1 = items; _i < items_1.length; _i++) {
            var item = items_1[_i];
            if (item.present) {
                snapshotInfo.item_hashes[item.idHash] = item.configHash;
                if (!(item.idHash in this._configHashes)) {
                    missingHashes.push(item.configHash);
                }
            }
            else {
                delete snapshotInfo.item_hashes[item.idHash];
            }
        }
        var response = {};
        if (missingHashes.length > 0) {
            response.needed_configs = missingHashes;
        }
        this._counters.itemsReportCount++;
        return the_promise_1.Promise.resolve()
            .then(function () {
            return _this._context.webSocketUpdater.notifyReporter();
        })
            .then(function () { return response; });
    };
    Collector.prototype.activateSnapshot = function (snapshotId) {
        var _this = this;
        if (the_lodash_1.default.keys(this._snapshotsToProcess).length > 0) {
            return RESPONSE_NEED_NEW_SNAPSHOT;
        }
        this._counters.activateSnapshotCount++;
        return this._context.tracker.scope("collector::activateSnapshot", function (tracker) {
            var snapshotInfo = _this._snapshots[snapshotId];
            if (!snapshotInfo) {
                return RESPONSE_NEED_NEW_SNAPSHOT;
            }
            _this._lastReportDate = (0, moment_1.default)();
            _this._endMetric(snapshotInfo.metric);
            _this.logger.info("[_acceptSnapshot] item count: %s", the_lodash_1.default.keys(snapshotInfo.item_hashes).length);
            _this.logger.info("[_acceptSnapshot] metric: ", snapshotInfo.metric);
            var registry = new registry_1.ConcreteRegistry(_this._logger, snapshotInfo.id, snapshotInfo.date, snapshotInfo.agentVersion);
            for (var _i = 0, _a = the_lodash_1.default.keys(snapshotInfo.item_hashes); _i < _a.length; _i++) {
                var itemHash = _a[_i];
                var configHash = snapshotInfo.item_hashes[itemHash];
                var config = _this._configHashes[configHash];
                var itemId = _this._extractId(config);
                registry.add(itemId, config);
            }
            _this._cleanup();
            _this._snapshotsToProcess[snapshotInfo.id] = true;
            _this._context.facadeRegistry.acceptConcreteRegistry(registry);
            // Use only for debugging.
            // registry.debugOutputRegistry(`source-snapshot/${snapshotId}`);
            return _this._context.webSocketUpdater.notifyReporter()
                .then(function () { return ({}); });
        });
    };
    Collector.prototype.storeConfig = function (hash, config) {
        this._counters.reportConfigCount++;
        this._configHashes[hash] = config;
    };
    Collector.prototype.completeSnapshotProcessing = function (snapshotId) {
        this.logger.info("[completeSnapshotProcessing] snapshotId: %s", snapshotId);
        delete this._snapshotsToProcess[snapshotId];
    };
    Collector.prototype._extractId = function (config) {
        var c = config;
        return (0, helper_logic_processor_1.extractK8sConfigId)(c);
    };
    Collector.prototype._cleanup = function () {
        var snapshots = the_lodash_1.default.orderBy(the_lodash_1.default.values(this._snapshots), function (x) { return x.date; }, ['desc']);
        var liveSnapshots = the_lodash_1.default.take(snapshots, SNAPSHOT_QUEUE_SIZE);
        var toDeleteSnapshots = the_lodash_1.default.drop(snapshots, SNAPSHOT_QUEUE_SIZE);
        for (var _i = 0, toDeleteSnapshots_1 = toDeleteSnapshots; _i < toDeleteSnapshots_1.length; _i++) {
            var snapshot = toDeleteSnapshots_1[_i];
            delete this._snapshots[snapshot.id];
        }
        var configHashesList = liveSnapshots.map(function (x) { return the_lodash_1.default.values(x.item_hashes); });
        var finalConfigHashes = the_lodash_1.default.union.apply(null, configHashesList);
        var configHashesToDelete = the_lodash_1.default.difference(the_lodash_1.default.keys(this._configHashes), finalConfigHashes);
        for (var _a = 0, configHashesToDelete_1 = configHashesToDelete; _a < configHashesToDelete_1.length; _a++) {
            var configHash = configHashesToDelete_1[_a];
            delete this._configHashes[configHash];
        }
    };
    Collector.prototype._canAcceptNewSnapshot = function () {
        if (the_lodash_1.default.keys(this._snapshotsToProcess).length > 0) {
            return { success: false, delaySec: 60 };
        }
        if (this._context.facadeRegistry.jobDampener.isBusy) {
            return { success: false, delaySec: 60 };
        }
        if (!this._context.database.isConnected) {
            return { success: false, delaySec: 30 };
        }
        // if (!this._context.historyProcessor.isDbReady) {
        //     return { success: false, delaySec: 30 };
        // }
        if (this._lastReportDate) {
            // this.logger.info("[_canAcceptNewSnapshot] Last Report Date: %s", this._lastReportDate.toISOString());
            var nextAcceptDate = (0, moment_1.default)(this._lastReportDate).add(this._reportingDelay, "seconds");
            var diff = nextAcceptDate.diff((0, moment_1.default)(), "second");
            if (diff >= 5) {
                return { success: false, delaySec: diff };
            }
        }
        return { success: true };
    };
    Collector.prototype.extractMetrics = function () {
        var metrics = [];
        metrics.push({
            category: 'Collector',
            name: 'Parser Version',
            value: this._agentVersion ? this._agentVersion : 'unknown'
        });
        metrics.push({
            category: 'Collector',
            name: 'Recent Collection Durations',
            value: JSON.stringify(this._recentDurations)
        });
        metrics.push({
            category: 'Collector',
            name: 'New Snapshot Counter',
            value: this._counters.newSnapshotCount
        });
        metrics.push({
            category: 'Collector',
            name: 'Activate Snapshot Counter',
            value: this._counters.activateSnapshotCount
        });
        metrics.push({
            category: 'Collector',
            name: 'Items Report Counter',
            value: this._counters.itemsReportCount
        });
        metrics.push({
            category: 'Collector',
            name: 'Config Report Counter',
            value: this._counters.reportConfigCount
        });
        if (this._currentMetric && !this._currentMetric.dateEnd) {
            metrics.push({
                category: 'Collector',
                name: 'Current Report Date',
                value: this._currentMetric.dateStart
            });
            metrics.push({
                category: 'Collector',
                name: 'Current Report Kind',
                value: this._currentMetric.kind
            });
            var durationSeconds = data_models_1.DateUtils.diffSeconds(new Date(), this._currentMetric.dateStart);
            metrics.push({
                category: 'Collector',
                name: 'Current Report Duration(sec). Still collecting...',
                value: durationSeconds
            });
        }
        if (this._latestMetric) {
            metrics.push({
                category: 'Collector',
                name: 'Latest Report Date',
                value: this._latestMetric.dateStart
            });
            metrics.push({
                category: 'Collector',
                name: 'Latest Report Kind',
                value: this._latestMetric.kind
            });
            if (this._latestMetric.durationSeconds) {
                metrics.push({
                    category: 'Collector',
                    name: 'Latest Report Duration(sec)',
                    value: this._latestMetric.durationSeconds
                });
            }
        }
        return metrics;
    };
    Collector.prototype._newMetric = function (date, kind) {
        var metric = {
            origDate: date,
            dateStart: new Date(),
            dateEnd: null,
            kind: kind,
            durationSeconds: null
        };
        this._currentMetric = metric;
        return metric;
    };
    Collector.prototype._endMetric = function (metric) {
        metric.dateEnd = new Date();
        metric.durationSeconds = data_models_1.DateUtils.diffSeconds(metric.dateEnd, metric.dateStart);
        this._recentDurations.push(metric.durationSeconds);
        this._recentDurations = the_lodash_1.default.takeRight(this._recentDurations, 10);
        this._latestMetric = metric;
        return metric;
    };
    return Collector;
}());
exports.Collector = Collector;
var RESPONSE_NEED_NEW_SNAPSHOT = {
    new_snapshot: true
};
//# sourceMappingURL=collector.js.map