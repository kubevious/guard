"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Context = void 0;
var the_lodash_1 = __importDefault(require("the-lodash"));
var registry_1 = require("./facade/registry");
var db_1 = require("./db");
var registry_2 = require("./registry/registry");
var collector_1 = require("./collector/collector");
var debug_object_logger_1 = require("./utils/debug-object-logger");
var snapshot_processor_1 = require("./snapshot-processor");
var worldvious_client_1 = require("@kubevious/worldvious-client");
var helper_redis_1 = require("@kubevious/helper-redis");
var server_1 = require("./server");
var data_models_1 = require("@kubevious/data-models");
var helper_logic_processor_1 = require("@kubevious/helper-logic-processor");
var executor_1 = require("./app/executor/executor");
var data_models_2 = require("@kubevious/data-models");
var version_1 = __importDefault(require("./version"));
var websocket_updater_1 = require("./app/websocket-updater/websocket-updater");
var backend_metrics_1 = require("./app/backend-metrics");
var Context = /** @class */ (function () {
    function Context(backend) {
        var _this = this;
        this._backend = backend;
        this._logger = backend.logger.sublogger('Context');
        this._logger.info("Version: %s", version_1.default);
        this._worldvious = new worldvious_client_1.WorldviousClient(this.logger, 'collector', version_1.default);
        this._parserLoader = new helper_logic_processor_1.ParserLoader(this.logger);
        this._dataStore = new db_1.Database(this._logger, this);
        this._redis = new helper_redis_1.RedisClient(this.logger.sublogger('Redis'));
        this._backendMetrics = new backend_metrics_1.BackendMetrics(this);
        this._collector = new collector_1.Collector(this);
        this._registry = new registry_2.Registry(this);
        this._facadeRegistry = new registry_1.FacadeRegistry(this);
        this._executor = new executor_1.Executor(this);
        this._debugObjectLogger = new debug_object_logger_1.DebugObjectLogger(this);
        this._configAccessor = new data_models_2.ConfigAccessor(this._dataStore.dataStore, this._dataStore.config);
        this._snapshotProcessor = new snapshot_processor_1.SnapshotProcessor(this);
        this._webSocketUpdater = new websocket_updater_1.WebSocketUpdater(this);
        this._seriesResamplerHelper = new data_models_1.SeriesResampler(200)
            .column("changes", function (x) { var _a; return (_a = the_lodash_1.default.max(x)) !== null && _a !== void 0 ? _a : 0; })
            .column("error", the_lodash_1.default.mean)
            .column("warn", the_lodash_1.default.mean);
        this._server = new server_1.WebServer(this);
        backend.registerErrorHandler(function (reason) {
            return _this.worldvious.acceptError(reason);
        });
        backend.stage("setup-worldvious", function () { return _this._worldvious.init(); });
        backend.stage("setup-metrics-tracker", function () { return _this._setupMetricsTracker(); });
        backend.stage("setup-db", function () { return _this._dataStore.init(); });
        backend.stage("redis", function () { return _this._redis.run(); });
        backend.stage("setup-facade", function () { return _this._facadeRegistry.init(); });
        backend.stage("setup-parser-loader", function () { return _this._parserLoader.init(); });
        backend.stage("setup-server", function () { return _this._server.run(); });
    }
    Object.defineProperty(Context.prototype, "backend", {
        get: function () {
            return this._backend;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Context.prototype, "logger", {
        get: function () {
            return this._logger;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Context.prototype, "tracker", {
        get: function () {
            return this.backend.tracker;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Context.prototype, "mysqlDriver", {
        get: function () {
            return this.database.driver;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Context.prototype, "database", {
        get: function () {
            return this._dataStore;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Context.prototype, "dataStore", {
        get: function () {
            return this._dataStore;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Context.prototype, "redis", {
        get: function () {
            return this._redis;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Context.prototype, "executor", {
        get: function () {
            return this._executor;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Context.prototype, "facadeRegistry", {
        get: function () {
            return this._facadeRegistry;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Context.prototype, "collector", {
        get: function () {
            return this._collector;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Context.prototype, "registry", {
        get: function () {
            return this._registry;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Context.prototype, "debugObjectLogger", {
        get: function () {
            return this._debugObjectLogger;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Context.prototype, "configAccessor", {
        get: function () {
            return this._configAccessor;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Context.prototype, "snapshotProcessor", {
        get: function () {
            return this._snapshotProcessor;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Context.prototype, "worldvious", {
        get: function () {
            return this._worldvious;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Context.prototype, "seriesResamplerHelper", {
        get: function () {
            return this._seriesResamplerHelper;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Context.prototype, "webSocketUpdater", {
        get: function () {
            return this._webSocketUpdater;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Context.prototype, "parserLoader", {
        get: function () {
            return this._parserLoader;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Context.prototype, "backendMetrics", {
        get: function () {
            return this._backendMetrics;
        },
        enumerable: false,
        configurable: true
    });
    Context.prototype._setupMetricsTracker = function () {
        var _this = this;
        this.tracker.registerListener(function (extractedData) {
            _this._worldvious.acceptMetrics(extractedData);
        });
    };
    return Context;
}());
exports.Context = Context;
//# sourceMappingURL=context.js.map