"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeKey = exports.DBSnapshot = void 0;
var the_lodash_1 = __importDefault(require("the-lodash"));
var data_models_1 = require("@kubevious/data-models");
var data_models_2 = require("@kubevious/data-models");
var DBSnapshot = /** @class */ (function () {
    function DBSnapshot(snapshotId, date) {
        this._items = {};
        this._snapshotId = snapshotId;
        if (snapshotId) {
            this._partitionId = data_models_1.UuidUtils.getPartFromDatedUUIDBuf(snapshotId);
        }
        else {
            this._partitionId = null;
        }
        this._date = new Date(date);
    }
    Object.defineProperty(DBSnapshot.prototype, "partitionId", {
        get: function () {
            return this._partitionId;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DBSnapshot.prototype, "snapshotId", {
        get: function () {
            return this._snapshotId;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DBSnapshot.prototype, "date", {
        get: function () {
            return this._date;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DBSnapshot.prototype, "count", {
        get: function () {
            return the_lodash_1.default.keys(this._items).length;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DBSnapshot.prototype, "keys", {
        get: function () {
            return the_lodash_1.default.keys(this._items);
        },
        enumerable: false,
        configurable: true
    });
    DBSnapshot.prototype.addItemByKey = function (key, item) {
        this._items[key] = item;
    };
    DBSnapshot.prototype.addItem = function (item) {
        this._items[makeKey(item)] = item;
    };
    DBSnapshot.prototype.addItems = function (items) {
        for (var _i = 0, items_1 = items; _i < items_1.length; _i++) {
            var item = items_1[_i];
            this.addItem(item);
        }
    };
    DBSnapshot.prototype.deleteItem = function (item) {
        this.delteById(makeKey(item));
    };
    DBSnapshot.prototype.delteById = function (id) {
        delete this._items[id];
    };
    DBSnapshot.prototype.getItems = function () {
        return the_lodash_1.default.values(this._items);
    };
    DBSnapshot.prototype.getDict = function () {
        return the_lodash_1.default.cloneDeep(this._items);
    };
    DBSnapshot.prototype.findById = function (id) {
        var item = this._items[id];
        if (!item) {
            return null;
        }
        return item;
    };
    DBSnapshot.prototype.findItem = function (item) {
        return this.findById(makeKey(item));
    };
    DBSnapshot.prototype.cloneItemsFrom = function (other) {
        for (var _i = 0, _a = the_lodash_1.default.keys(other._items); _i < _a.length; _i++) {
            var key = _a[_i];
            this._items[key] = other._items[key];
        }
    };
    DBSnapshot.prototype.export = function () {
        var contents = {
            snapshot_id: this.snapshotId ? data_models_2.BufferUtils.toStr(this.snapshotId) : null,
            item_count: this.keys.length,
            snapshot_keys: this.keys.sort(),
            snapshot_items: this.getItems().map(function (x) {
                return {
                    dn: x.dn,
                    kind: x.kind,
                    config_kind: x.config_kind,
                    name: x.name,
                    config_hash: data_models_2.BufferUtils.toStr(x.config_hash)
                };
            })
        };
        return contents;
    };
    return DBSnapshot;
}());
exports.DBSnapshot = DBSnapshot;
function makeKey(item) {
    if (!item.dn) {
        throw new Error("MISSING DN");
    }
    if (!item.kind) {
        throw new Error("MISSING kind");
    }
    if (!item.config_kind) {
        throw new Error("MISSING config_kind");
    }
    var parts = [
        item.dn,
        item.kind,
        item.config_kind
    ];
    if (item.name) {
        parts.push(item.name);
    }
    return parts.join('-');
}
exports.makeKey = makeKey;
//# sourceMappingURL=snapshot.js.map