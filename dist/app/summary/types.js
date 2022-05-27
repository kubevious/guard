"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.newDeltaSummary = exports.newSnapshotSummary = exports.newAlertsCounter = void 0;
function newAlertsCounter() {
    return {
        error: 0,
        warn: 0
    };
}
exports.newAlertsCounter = newAlertsCounter;
function newSnapshotSummary() {
    var summary = {
        items: 0,
        kinds: {},
        alerts: newAlertsCounter(),
        alertsByKind: {}
    };
    return summary;
}
exports.newSnapshotSummary = newSnapshotSummary;
function newDeltaSummary() {
    var deltaSummary = {
        snapshot: newSnapshotSummary(),
        delta: newSnapshotSummary()
    };
    return deltaSummary;
}
exports.newDeltaSummary = newDeltaSummary;
//# sourceMappingURL=types.js.map