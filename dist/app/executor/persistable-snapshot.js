"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PersistableSnapshot = void 0;
var the_lodash_1 = __importDefault(require("the-lodash"));
var data_models_1 = require("@kubevious/data-models");
var data_models_2 = require("@kubevious/data-models");
var snapshot_1 = require("../reader/snapshot");
var PersistableSnapshot = /** @class */ (function () {
    function PersistableSnapshot(snapshotId, date) {
        this._configs = {};
        this._nodeConfigs = [];
        this._isDiffSnapshot = false;
        this._diffItems = {};
        this._dbSnapshot = new snapshot_1.DBSnapshot(snapshotId, date);
    }
    Object.defineProperty(PersistableSnapshot.prototype, "partitionId", {
        get: function () {
            return this._dbSnapshot.partitionId;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(PersistableSnapshot.prototype, "snapshotId", {
        get: function () {
            return this._dbSnapshot.snapshotId;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(PersistableSnapshot.prototype, "date", {
        get: function () {
            return this.dbSnapshot.date;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(PersistableSnapshot.prototype, "snapItemCount", {
        get: function () {
            return this.dbSnapshot.count;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(PersistableSnapshot.prototype, "dbSnapshot", {
        get: function () {
            return this._dbSnapshot;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(PersistableSnapshot.prototype, "configs", {
        get: function () {
            return this._configs;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(PersistableSnapshot.prototype, "nodeConfigs", {
        get: function () {
            return this._nodeConfigs;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(PersistableSnapshot.prototype, "diffKeys", {
        get: function () {
            return the_lodash_1.default.keys(this._diffItems);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(PersistableSnapshot.prototype, "diffItems", {
        get: function () {
            return the_lodash_1.default.values(this._diffItems);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(PersistableSnapshot.prototype, "diffItemCount", {
        get: function () {
            return this.diffItems.length;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(PersistableSnapshot.prototype, "isDiffSnapshot", {
        get: function () {
            return this._isDiffSnapshot;
        },
        enumerable: false,
        configurable: true
    });
    PersistableSnapshot.prototype.addItem = function (item) {
        this._dbSnapshot.addItem(item);
    };
    PersistableSnapshot.prototype.addDiffItem = function (item) {
        this._diffItems[(0, snapshot_1.makeKey)(item)] = item;
    };
    PersistableSnapshot.prototype.addConfig = function (config) {
        var hash = data_models_2.HashUtils.calculateObjectHash(config);
        var hashStr = data_models_1.BufferUtils.toStr(hash);
        this._configs[hashStr] = {
            hash: hash,
            hashStr: hashStr,
            config: config
        };
        return hash;
    };
    PersistableSnapshot.prototype.getConfig = function (hash) {
        var hashStr;
        if (the_lodash_1.default.isString(hash)) {
            hashStr = hash;
        }
        else {
            hashStr = data_models_1.BufferUtils.toStr(hash);
        }
        var config = this._configs[hashStr];
        if (config) {
            return config.config;
        }
        return null;
    };
    PersistableSnapshot.prototype.addNodeConfig = function (dn, config) {
        this._nodeConfigs.push({
            dn: dn,
            config: config
        });
    };
    PersistableSnapshot.prototype.constructDiff = function (id) {
        var newSnapshot = new PersistableSnapshot(id, this.date);
        newSnapshot._isDiffSnapshot = true;
        newSnapshot._configs = this._configs;
        return newSnapshot;
    };
    PersistableSnapshot.prototype.export = function () {
        var contents = {
            snapshot: this.dbSnapshot.export(),
            diff: {
                item_count: this.diffKeys.length,
                diff_keys: this.diffKeys.sort(),
                diff_items: this.diffItems.map(function (x) {
                    return {
                        dn: x.dn,
                        kind: x.kind,
                        config_kind: x.config_kind,
                        name: x.name,
                        present: x.present,
                        config_hash: x.config_hash ? data_models_1.BufferUtils.toStr(x.config_hash) : null
                    };
                })
            }
        };
        return contents;
    };
    return PersistableSnapshot;
}());
exports.PersistableSnapshot = PersistableSnapshot;
//# sourceMappingURL=persistable-snapshot.js.map