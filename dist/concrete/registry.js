"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConcreteRegistry = void 0;
var the_lodash_1 = __importDefault(require("the-lodash"));
var the_promise_1 = require("the-promise");
var item_1 = require("./item");
var js_yaml_1 = __importDefault(require("js-yaml"));
var ConcreteRegistry = /** @class */ (function () {
    function ConcreteRegistry(logger, snapshotId, date, agentVersion) {
        this._flatItemsDict = {};
        this._itemsKindDict = {};
        this._logger = logger.sublogger("ConcreteRegistry");
        this._snapshotId = snapshotId;
        this._date = date;
        this._agentVersion = agentVersion;
    }
    Object.defineProperty(ConcreteRegistry.prototype, "logger", {
        get: function () {
            return this._logger;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ConcreteRegistry.prototype, "snapshotId", {
        get: function () {
            return this._snapshotId;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ConcreteRegistry.prototype, "date", {
        get: function () {
            return this._date;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ConcreteRegistry.prototype, "agentVersion", {
        get: function () {
            return this._agentVersion;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ConcreteRegistry.prototype, "allItems", {
        get: function () {
            return the_lodash_1.default.values(this._flatItemsDict);
        },
        enumerable: false,
        configurable: true
    });
    ConcreteRegistry.prototype.add = function (id, obj) {
        this.logger.verbose("[add] ", id);
        var rawId = this._makeDictId(id);
        var item = new item_1.ConcreteItem(this, id, obj);
        this._flatItemsDict[rawId] = item;
        if (!this._itemsKindDict[item.groupKey]) {
            this._itemsKindDict[item.groupKey] = {};
        }
        this._itemsKindDict[item.groupKey][rawId] = item;
    };
    ConcreteRegistry.prototype.remove = function (id) {
        this.logger.verbose("[remove] %s", id);
        var rawId = this._makeDictId(id);
        var item = this._flatItemsDict[rawId];
        if (item) {
            var groupDict = this._itemsKindDict[item.groupKey];
            if (groupDict) {
                delete groupDict[rawId];
                if (the_lodash_1.default.keys(groupDict).length !== 0) {
                    delete this._itemsKindDict[item.groupKey];
                }
            }
            else {
                this.logger.warn("[remove] Failed to remove kind group key %s for %s", item.groupKey, rawId);
            }
            delete this._flatItemsDict[rawId];
        }
    };
    ConcreteRegistry.prototype.findById = function (id) {
        var rawId = this._makeDictId(id);
        var item = this._flatItemsDict[rawId];
        if (item) {
            return item;
        }
        return null;
    };
    ConcreteRegistry.prototype.filterItems = function (idFilter) {
        var result = [];
        for (var _i = 0, _a = this.allItems; _i < _a.length; _i++) {
            var item = _a[_i];
            if (item.matchesFilter(idFilter)) {
                result.push(item);
            }
        }
        return result;
    };
    ConcreteRegistry.prototype._makeDictId = function (id) {
        if (the_lodash_1.default.isString(id)) {
            return id;
        }
        return the_lodash_1.default.stableStringify(id);
    };
    ConcreteRegistry.prototype.extractCapacity = function () {
        var cap = [];
        for (var _i = 0, _a = the_lodash_1.default.keys(this._itemsKindDict); _i < _a.length; _i++) {
            var groupKey = _a[_i];
            cap.push({
                name: groupKey,
                count: the_lodash_1.default.keys(this._itemsKindDict[groupKey]).length
            });
        }
        cap = the_lodash_1.default.orderBy(cap, ['count', 'name'], ['desc', 'asc']);
        return cap;
    };
    ConcreteRegistry.prototype.debugOutputCapacity = function () {
        this.logger.info("[concreteRegistry] >>>>>>>");
        this.logger.info("[concreteRegistry] Total Count: %s", the_lodash_1.default.keys(this._flatItemsDict).length);
        var counters = this.extractCapacity();
        for (var _i = 0, counters_1 = counters; _i < counters_1.length; _i++) {
            var x = counters_1[_i];
            this.logger.info("[concreteRegistry] %s :: %s", x.name, x.count);
        }
        this.logger.info("[concreteRegistry] <<<<<<<");
    };
    ConcreteRegistry.prototype.debugOutputToFile = function () {
        var _this = this;
        var writer = this.logger.outputStream("dump-concrete-registry");
        if (!writer) {
            return the_promise_1.Promise.resolve();
        }
        this.logger.info("[debugOutputToFile] BEGIN");
        var ids = the_lodash_1.default.keys(this._flatItemsDict);
        ids.sort();
        for (var _i = 0, ids_1 = ids; _i < ids_1.length; _i++) {
            var id = ids_1[_i];
            writer.write('-) ' + id);
            var item = this._flatItemsDict[id];
            item.debugOutputToFile(writer);
            writer.newLine();
        }
        writer.newLine();
        writer.newLine();
        writer.write("******************************************");
        writer.write("******************************************");
        writer.write("******************************************");
        writer.newLine();
        writer.newLine();
        return the_promise_1.Promise.resolve(writer.close())
            .then(function () {
            _this.logger.info("[debugOutputToFile] END");
        });
    };
    ConcreteRegistry.prototype.dump = function () {
        var result = {};
        var ids = the_lodash_1.default.keys(this._flatItemsDict);
        ids.sort();
        for (var _i = 0, ids_2 = ids; _i < ids_2.length; _i++) {
            var id = ids_2[_i];
            var item = this._flatItemsDict[id];
            result[id] = item.dump();
        }
        return result;
    };
    ConcreteRegistry.prototype.debugOutputRegistry = function (registryName) {
        for (var _i = 0, _a = this.allItems; _i < _a.length; _i++) {
            var item = _a[_i];
            var content = js_yaml_1.default.dump(item.config, { indent: 4 });
            var fileDir = "".concat(registryName);
            if (item.config && item.config.synthetic) {
                fileDir = "".concat(fileDir, "/synthetic");
            }
            else {
                fileDir = "".concat(fileDir, "/k8s");
            }
            fileDir = "".concat(fileDir, "//").concat(item.groupKey);
            var fileName = '';
            if (item.id.namespace) {
                fileName = "".concat(item.id.namespace, "-");
            }
            fileName = "".concat(fileName).concat(item.id.name, ".yaml");
            var filePath = "".concat(fileDir, "/").concat(fileName);
            this.logger.outputFile(filePath, content);
        }
    };
    return ConcreteRegistry;
}());
exports.ConcreteRegistry = ConcreteRegistry;
//# sourceMappingURL=registry.js.map