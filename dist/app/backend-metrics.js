"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackendMetrics = void 0;
var the_lodash_1 = __importDefault(require("the-lodash"));
var version_1 = __importDefault(require("../version"));
var BackendMetrics = /** @class */ (function () {
    function BackendMetrics(context) {
        this._context = context;
        this._logger = context.logger.sublogger("BackendMetrics");
    }
    Object.defineProperty(BackendMetrics.prototype, "logger", {
        get: function () {
            return this._logger;
        },
        enumerable: false,
        configurable: true
    });
    BackendMetrics.prototype.extractMetrics = function () {
        var metrics = [];
        metrics.push({
            category: "Collector",
            name: "Version",
            value: version_1.default
        });
        metrics.push({
            category: "Collector",
            name: "MySQL Connected",
            value: this._context.dataStore.isConnected
        });
        metrics.push({
            category: "Collector",
            name: "Redis Connected",
            value: this._context.redis.isConnected
        });
        {
            var newMetrics = this._context.collector.extractMetrics();
            metrics = the_lodash_1.default.concat(metrics, newMetrics);
        }
        {
            var newMetrics = this._context.executor.extractMetrics();
            metrics = the_lodash_1.default.concat(metrics, newMetrics);
        }
        return metrics;
    };
    return BackendMetrics;
}());
exports.BackendMetrics = BackendMetrics;
//# sourceMappingURL=backend-metrics.js.map