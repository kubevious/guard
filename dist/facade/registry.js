"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FacadeRegistry = void 0;
var the_promise_1 = require("the-promise");
var helpers_1 = require("@kubevious/helpers");
var FacadeRegistry = /** @class */ (function () {
    function FacadeRegistry(context) {
        this._latestDampenerState = null;
        this._context = context;
        this._logger = context.logger.sublogger("FacadeRegistry");
        this._jobDampener = new helpers_1.JobDampener(this._logger.sublogger("FacadeDampener"), this._processConcreteRegistry.bind(this), {
            queueSize: 1,
            rescheduleTimeoutMs: 1000,
            stateMonitorCb: this._jobDampenerStateMonitorCb.bind(this)
        });
    }
    Object.defineProperty(FacadeRegistry.prototype, "logger", {
        get: function () {
            return this._logger;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(FacadeRegistry.prototype, "debugObjectLogger", {
        get: function () {
            return this._context.debugObjectLogger;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(FacadeRegistry.prototype, "jobDampener", {
        get: function () {
            return this._jobDampener;
        },
        enumerable: false,
        configurable: true
    });
    FacadeRegistry.prototype.init = function () {
        this._context.dataStore.onConnect(this._onDbConnect.bind(this));
    };
    FacadeRegistry.prototype.acceptConcreteRegistry = function (registry) {
        this.logger.info('[acceptConcreteRegistry] count: %s', registry.allItems.length);
        this._jobDampener.acceptJob(registry);
    };
    FacadeRegistry.prototype._processConcreteRegistry = function (registry, date) {
        this._logger.info("[_processConcreteRegistry] Date: %s. Item count: %s, Snapshot: %s", date.toISOString(), registry.allItems.length, registry.snapshotId);
        return this._context.executor.process({
            registry: registry,
        });
    };
    FacadeRegistry.prototype._jobDampenerStateMonitorCb = function (state) {
        var _this = this;
        this._logger.info("[_jobDampenerStateMonitorCb] ", state);
        this._latestDampenerState = state;
        return the_promise_1.Promise.resolve(null)
            .then(function () {
            if (_this._context.dataStore.isConnected) {
                return _this._persistLatestJobProcessorState();
            }
            else {
                _this._logger.info("[_jobDampenerStateMonitorCb] NOT YET CONNECTED TO DB");
            }
        });
    };
    FacadeRegistry.prototype._onDbConnect = function () {
        return this._persistLatestJobProcessorState();
    };
    FacadeRegistry.prototype._persistLatestJobProcessorState = function () {
        var _this = this;
        var _a;
        if (!this._latestDampenerState) {
            return;
        }
        var info = {
            snapshots_in_queue: (_a = this._latestDampenerState.totalJobs) !== null && _a !== void 0 ? _a : 0
        };
        return the_promise_1.Promise.resolve()
            .then(function () { return _this._context.configAccessor.setCollectorStateConfig(info); })
            .then(function () { return _this._context.webSocketUpdater.notifyReporter(); });
    };
    return FacadeRegistry;
}());
exports.FacadeRegistry = FacadeRegistry;
//# sourceMappingURL=registry.js.map