"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Executor = void 0;
var the_lodash_1 = __importDefault(require("the-lodash"));
var executor_task_1 = require("./executor-task");
var data_models_1 = require("@kubevious/data-models");
var helper_backend_1 = require("@kubevious/helper-backend");
var Executor = /** @class */ (function () {
    function Executor(context) {
        this._context = context;
        this._logger = context.logger.sublogger('Executor');
        this._counters = {
            processCount: 0,
            recentDurations: []
        };
    }
    Object.defineProperty(Executor.prototype, "logger", {
        get: function () {
            return this._logger;
        },
        enumerable: false,
        configurable: true
    });
    Executor.prototype.process = function (target) {
        var _this = this;
        var stopwatch = new helper_backend_1.StopWatch();
        var myTarget = this._makeTaskTarget(target);
        return this._context.tracker.scope("executor", function (innerTracker) {
            var task = new executor_task_1.ExecutorTask(_this._logger, _this._context, myTarget);
            return task.execute(innerTracker);
        })
            .then(function () {
            _this._markComplete(target, stopwatch);
        })
            .catch(function (error) {
            _this._logger.error("[Executor] ERROR: ", error);
            _this._markComplete(target, stopwatch);
        });
    };
    Executor.prototype.extractMetrics = function () {
        var metrics = [];
        metrics.push({
            category: 'Collector',
            name: 'Executor Process Counter',
            value: this._counters.processCount
        });
        metrics.push({
            category: 'Collector',
            name: 'Executor Process Durations',
            value: JSON.stringify(this._counters.recentDurations)
        });
        return metrics;
    };
    Executor.prototype._makeTaskTarget = function (target) {
        var myTarget = {
            registry: target.registry,
            snapshotId: data_models_1.BufferUtils.fromStr(target.registry.snapshotId),
            date: target.registry.date,
            counters: this._counters
        };
        return myTarget;
    };
    Executor.prototype._markComplete = function (target, stopwatch) {
        this._counters.processCount++;
        {
            var durationMs = stopwatch.stop() / 1000;
            this._counters.recentDurations.push(durationMs);
            this._counters.recentDurations = the_lodash_1.default.takeRight(this._counters.recentDurations, 10);
        }
        this._context.collector.completeSnapshotProcessing(target.registry.snapshotId);
    };
    return Executor;
}());
exports.Executor = Executor;
//# sourceMappingURL=executor.js.map