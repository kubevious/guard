"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SnapshotReader = void 0;
var snapshot_1 = require("./snapshot");
var data_models_1 = require("@kubevious/data-models");
var data_models_2 = require("@kubevious/data-models");
var SnapshotReader = /** @class */ (function () {
    function SnapshotReader(logger, context, target) {
        this._context = context;
        this._logger = logger.sublogger('SnapshotReader');
        this._target = target;
        this._snapshotId = target.snapshotId;
        this._dataStore = context.dataStore.dataStore;
        this._partId = data_models_2.UuidUtils.getPartFromDatedUUIDBuf(target.snapshotId);
    }
    SnapshotReader.prototype.queryProcessableData = function () {
        var _this = this;
        return this.querySnapshotRow()
            .then(function (snapshotRow) {
            if (!snapshotRow) {
                return null;
            }
            var snapItemsOwnerId = null;
            var diffItemsOwnerId = null;
            _this._logger.silly("snapshotRow: ", snapshotRow);
            if (snapshotRow.base_snapshot_id) {
                snapItemsOwnerId = snapshotRow.base_snapshot_id;
                diffItemsOwnerId = _this._target.snapshotId;
            }
            else {
                snapItemsOwnerId = _this._target.snapshotId;
            }
            _this._logger.silly("SNAPSHOT ID: %s", data_models_1.BufferUtils.toStr(snapItemsOwnerId));
            var baseDbSnapshot = new snapshot_1.DBSnapshot(snapItemsOwnerId, snapshotRow.date);
            return _this._querySnapshotItems(snapItemsOwnerId)
                .then(function (items) {
                baseDbSnapshot.addItems(items);
                if (diffItemsOwnerId) {
                    _this._logger.silly("DIFF ID: %s", data_models_1.BufferUtils.toStr(diffItemsOwnerId));
                    var diffDbSnapshot_1 = new snapshot_1.DBSnapshot(diffItemsOwnerId, snapshotRow.date);
                    diffDbSnapshot_1.cloneItemsFrom(baseDbSnapshot);
                    return _this._queryDiffItems(diffItemsOwnerId)
                        .then(function (diffItems) {
                        for (var _i = 0, diffItems_1 = diffItems; _i < diffItems_1.length; _i++) {
                            var diffItem = diffItems_1[_i];
                            if (diffItem.present) {
                                diffDbSnapshot_1.addItem({
                                    dn: diffItem.dn,
                                    kind: diffItem.kind,
                                    config_kind: diffItem.config_kind,
                                    name: diffItem.name,
                                    config_hash: diffItem.config_hash,
                                });
                            }
                            else {
                                diffDbSnapshot_1.deleteItem(diffItem);
                            }
                        }
                        return {
                            baseSnapshot: baseDbSnapshot,
                            snapshot: diffDbSnapshot_1,
                            summary: snapshotRow.summary
                        };
                    });
                }
                else {
                    return {
                        snapshot: baseDbSnapshot,
                        summary: snapshotRow.summary
                    };
                }
            });
        });
    };
    SnapshotReader.prototype.querySnapshotRow = function () {
        return this._dataStore.table(this._context.dataStore.snapshots.Snapshots)
            .queryOne({
            part: this._partId,
            snapshot_id: this._snapshotId
        });
    };
    SnapshotReader.prototype.querySnapshotSummary = function () {
        return this._dataStore.table(this._context.dataStore.snapshots.Snapshots)
            .queryOne({
            part: this._partId,
            snapshot_id: this._snapshotId
        }, {
            fields: { fields: ['summary'] }
        })
            .then(function (row) {
            if (!row) {
                return null;
            }
            return row.summary;
        });
    };
    SnapshotReader.prototype._querySnapshotItems = function (snapshotId) {
        var partId = data_models_2.UuidUtils.getPartFromDatedUUIDBuf(snapshotId);
        return this._dataStore.table(this._context.dataStore.snapshots.SnapItems)
            .queryMany({
            part: partId,
            snapshot_id: snapshotId
        });
    };
    SnapshotReader.prototype._queryDiffItems = function (snapshotId) {
        var partId = data_models_2.UuidUtils.getPartFromDatedUUIDBuf(snapshotId);
        return this._dataStore.table(this._context.dataStore.snapshots.DiffItems)
            .queryMany({
            part: partId,
            snapshot_id: snapshotId
        });
    };
    return SnapshotReader;
}());
exports.SnapshotReader = SnapshotReader;
//# sourceMappingURL=snapshot-reader.js.map