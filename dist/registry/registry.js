"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Registry = void 0;
var state_registry_1 = require("@kubevious/state-registry");
var Registry = /** @class */ (function () {
    function Registry(context) {
        this._context = context;
        this._logger = context.logger.sublogger("Registry");
        this._currentState = new state_registry_1.RegistryState({ date: new Date(), items: [] }).buildBundle();
    }
    Object.defineProperty(Registry.prototype, "logger", {
        get: function () {
            return this._logger;
        },
        enumerable: false,
        configurable: true
    });
    Registry.prototype.getCurrentState = function () {
        return this._currentState;
    };
    Registry.prototype.accept = function (bundle) {
        this._currentState = bundle;
    };
    return Registry;
}());
exports.Registry = Registry;
//# sourceMappingURL=registry.js.map