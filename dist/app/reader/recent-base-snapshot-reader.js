"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecentBaseSnapshotReader = void 0;
var data_models_1 = require("@kubevious/data-models");
var snapshot_reader_1 = require("./snapshot-reader");
var RecentBaseSnapshotReader = /** @class */ (function () {
    function RecentBaseSnapshotReader(logger, context) {
        this._context = context;
        this._logger = logger.sublogger('RecentSnapshotReader');
    }
    RecentBaseSnapshotReader.prototype.query = function () {
        var _this = this;
        return this._queryLatestSnapshot()
            .then(function (latestSnapshotId) {
            if (!latestSnapshotId) {
                _this._logger.warn("No Latest Snapshot");
                return null;
            }
            _this._logger.info("Latest Snapshot: %s", latestSnapshotId);
            var reader = new snapshot_reader_1.SnapshotReader(_this._logger, _this._context, {
                snapshotId: data_models_1.BufferUtils.fromStr(latestSnapshotId)
            });
            return reader.queryProcessableData();
        });
    };
    RecentBaseSnapshotReader.prototype._queryLatestSnapshot = function () {
        return this._context.configAccessor.getLatestSnapshotId();
    };
    return RecentBaseSnapshotReader;
}());
exports.RecentBaseSnapshotReader = RecentBaseSnapshotReader;
//# sourceMappingURL=recent-base-snapshot-reader.js.map