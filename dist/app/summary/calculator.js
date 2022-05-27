"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SummaryCalculator = void 0;
var the_lodash_1 = __importDefault(require("the-lodash"));
var types_1 = require("./types");
var SummaryCalculator = /** @class */ (function () {
    function SummaryCalculator(logger, targetSnapshot, deltaSnapshot, prevSummary) {
        this._alertsSummary = {};
        this._timelineSummary = {
            changes: 0,
            error: 0,
            warn: 0
        };
        this._logger = logger.sublogger('SummaryCalculator');
        this._targetSnapshot = targetSnapshot;
        this._deltaSnapshot = deltaSnapshot;
        this._prevSummary = prevSummary;
    }
    Object.defineProperty(SummaryCalculator.prototype, "alertsSummary", {
        get: function () {
            return this._alertsSummary;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(SummaryCalculator.prototype, "timelineSummary", {
        get: function () {
            return this._timelineSummary;
        },
        enumerable: false,
        configurable: true
    });
    SummaryCalculator.prototype.process = function () {
        this._logger.info('[process] isDiffSnapshot: %s', this._deltaSnapshot.isDiffSnapshot);
        var deltaItems;
        if (this._deltaSnapshot.isDiffSnapshot) {
            deltaItems = this._deltaSnapshot.diffItems;
        }
        else {
            deltaItems = this._deltaSnapshot.dbSnapshot.getItems();
        }
        this._logger.info('[process] deltaItems count: %s', deltaItems.length);
        var deltaSummary = {
            snapshot: this._constructSnapshotSummary(this._targetSnapshot.dbSnapshot.getItems()),
            delta: this._constructSnapshotSummary(deltaItems)
        };
        this._alertsSummary = this._constructAlertsSummary();
        this._calculateCurrentSnapshotAlerts(deltaSummary.snapshot);
        this._calculateDeltaSnapshotAlerts(deltaSummary.snapshot, deltaSummary.delta);
        this._calculateTimelineSummary(deltaSummary);
        return deltaSummary;
    };
    SummaryCalculator.prototype._constructSnapshotSummary = function (items) {
        var dns = {};
        var summary = (0, types_1.newSnapshotSummary)();
        for (var _i = 0, _a = items.filter(function (x) { return x.config_kind != 'alerts'; }); _i < _a.length; _i++) {
            var item = _a[_i];
            if (!dns[item.dn]) {
                dns[item.dn] = true;
                summary.items = summary.items + 1;
                if (!summary.kinds[item.kind]) {
                    summary.kinds[item.kind] = 1;
                }
                else {
                    summary.kinds[item.kind] = summary.kinds[item.kind] + 1;
                }
            }
        }
        return summary;
    };
    SummaryCalculator.prototype._constructAlertsSummary = function () {
        var alertsDict = {};
        for (var _i = 0, _a = this._targetSnapshot.nodeConfigs; _i < _a.length; _i++) {
            var node = _a[_i];
            var kind = node.config.kind;
            if (node.config.selfAlertCount) {
                var selfAlertsDict = node.config.selfAlertCount;
                for (var _b = 0, _c = the_lodash_1.default.keys(selfAlertsDict); _b < _c.length; _b++) {
                    var severity = _c[_b];
                    var count = selfAlertsDict[severity];
                    if (count > 0) {
                        if (!alertsDict[kind]) {
                            alertsDict[kind] = {};
                        }
                        if (!alertsDict[kind][node.dn]) {
                            alertsDict[kind][node.dn] = (0, types_1.newAlertsCounter)();
                        }
                        alertsDict[kind][node.dn][severity] = count;
                    }
                }
            }
        }
        return alertsDict;
    };
    SummaryCalculator.prototype._calculateCurrentSnapshotAlerts = function (snapshotSummary) {
        var currentTotalAlerts = (0, types_1.newAlertsCounter)();
        var currentByKindAlerts = {};
        for (var _i = 0, _a = the_lodash_1.default.keys(this._alertsSummary); _i < _a.length; _i++) {
            var kind = _a[_i];
            var dict = this._alertsSummary[kind];
            currentByKindAlerts[kind] = (0, types_1.newAlertsCounter)();
            for (var _b = 0, _c = the_lodash_1.default.values(dict); _b < _c.length; _b++) {
                var itemAlerts = _c[_b];
                this._appendAlertCounts(currentTotalAlerts, itemAlerts);
                this._appendAlertCounts(currentByKindAlerts[kind], itemAlerts);
            }
        }
        snapshotSummary.alerts = currentTotalAlerts;
        snapshotSummary.alertsByKind = currentByKindAlerts;
    };
    SummaryCalculator.prototype._calculateDeltaSnapshotAlerts = function (snapshotSummary, deltaSummary) {
        var deltaAlertsDict = the_lodash_1.default.cloneDeep(snapshotSummary.alerts);
        var deltaAlertsByKindDict = the_lodash_1.default.cloneDeep(snapshotSummary.alertsByKind);
        this._subtractAlertCounts(deltaAlertsDict, this._prevSummary.snapshot.alerts);
        for (var _i = 0, _a = the_lodash_1.default.keys(this._prevSummary.snapshot.alertsByKind); _i < _a.length; _i++) {
            var kind = _a[_i];
            var dict = this._prevSummary.snapshot.alertsByKind[kind];
            if (!deltaAlertsByKindDict[kind]) {
                deltaAlertsByKindDict[kind] = (0, types_1.newAlertsCounter)();
            }
            this._subtractAlertCounts(deltaAlertsByKindDict[kind], dict);
        }
        for (var _b = 0, _c = the_lodash_1.default.keys(deltaAlertsByKindDict); _b < _c.length; _b++) {
            var kind = _c[_b];
            var dict = deltaAlertsByKindDict[kind];
            if (dict.error === 0 && dict.warn === 0) {
                delete deltaAlertsByKindDict[kind];
            }
        }
        deltaSummary.alerts = deltaAlertsDict;
        deltaSummary.alertsByKind = deltaAlertsByKindDict;
    };
    SummaryCalculator.prototype._calculateTimelineSummary = function (deltaSummary) {
        this._timelineSummary.changes = deltaSummary.delta.items;
        this._timelineSummary.error = deltaSummary.snapshot.alerts.error;
        this._timelineSummary.warn = deltaSummary.snapshot.alerts.warn;
    };
    SummaryCalculator.prototype._appendAlertCounts = function (counter, other) {
        counter.error += other.error;
        counter.warn += other.warn;
    };
    SummaryCalculator.prototype._subtractAlertCounts = function (counter, other) {
        counter.error -= other.error;
        counter.warn -= other.warn;
    };
    return SummaryCalculator;
}());
exports.SummaryCalculator = SummaryCalculator;
//# sourceMappingURL=calculator.js.map