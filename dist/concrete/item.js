"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConcreteItem = void 0;
var the_lodash_1 = __importDefault(require("the-lodash"));
var ConcreteItem = /** @class */ (function () {
    function ConcreteItem(registry, id, config) {
        this._registry = registry;
        this._id = id;
        this._config = config;
        this._groupKey = "".concat(id.api, ":").concat(id.kind);
    }
    Object.defineProperty(ConcreteItem.prototype, "logger", {
        get: function () {
            return this._registry.logger;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ConcreteItem.prototype, "registry", {
        get: function () {
            return this._registry;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ConcreteItem.prototype, "id", {
        get: function () {
            return this._id;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ConcreteItem.prototype, "groupKey", {
        get: function () {
            return this._groupKey;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ConcreteItem.prototype, "config", {
        get: function () {
            return this._config;
        },
        enumerable: false,
        configurable: true
    });
    ConcreteItem.prototype.matchesFilter = function (idFilter) {
        if (!this.id) {
            return false;
        }
        // if (!_.isObject(this.id)) {
        //     return false;
        // }
        if (!idFilter) {
            return true;
        }
        // TODO: VALIDATE THIS!
        // if (!_.isObject(idFilter)) {
        //     return false;
        // }
        for (var _i = 0, _a = the_lodash_1.default.keys(idFilter); _i < _a.length; _i++) {
            var key = _a[_i];
            var filterVal = idFilter[key];
            var idVal = the_lodash_1.default.get(this.id, key);
            if (!the_lodash_1.default.isEqual(filterVal, idVal)) {
                return false;
            }
        }
        return true;
    };
    ConcreteItem.prototype.debugOutputToFile = function (writer) {
        writer.indent();
        writer.write('ID:');
        writer.indent();
        writer.write(this.id);
        writer.unindent();
        if (this.config && (the_lodash_1.default.keys(this.config).length > 0)) {
            writer.write('Config:');
            writer.indent();
            writer.write(this.config);
            writer.unindent();
        }
        writer.unindent();
    };
    ConcreteItem.prototype.dump = function () {
        var result = {
            id: this.id
        };
        if (this.config) {
            result.config = this.config;
        }
        return result;
    };
    return ConcreteItem;
}());
exports.ConcreteItem = ConcreteItem;
//# sourceMappingURL=item.js.map