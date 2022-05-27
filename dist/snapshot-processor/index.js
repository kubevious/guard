"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SnapshotProcessor = void 0;
var the_lodash_1 = __importDefault(require("the-lodash"));
var the_promise_1 = require("the-promise");
var fs = __importStar(require("fs"));
var Path = __importStar(require("path"));
var SnapshotProcessor = /** @class */ (function () {
    function SnapshotProcessor(context) {
        this._processors = [];
        this._context = context;
        this._logger = context.logger.sublogger('SnapshotProcessor');
        this._extractProcessors();
    }
    Object.defineProperty(SnapshotProcessor.prototype, "logger", {
        get: function () {
            return this._logger;
        },
        enumerable: false,
        configurable: true
    });
    SnapshotProcessor.prototype._extractProcessors = function () {
        var location = 'processors';
        var processorsDir = Path.join(__dirname, location);
        this.logger.info('[_extractProcessors] from %s', processorsDir);
        var files = fs.readdirSync(processorsDir);
        files = the_lodash_1.default.filter(files, function (x) { return x.endsWith('.d.ts'); });
        for (var _i = 0, files_1 = files; _i < files_1.length; _i++) {
            var fileName = files_1[_i];
            var moduleName = fileName.replace('.d.ts', '');
            var modulePath = location + '/' + moduleName;
            this._logger.info("Loading processor %s from %s...", moduleName, modulePath);
            var processorModule = require('./' + modulePath);
            var processorBuilder = processorModule.default;
            var processorInfo = processorBuilder._export();
            if (!processorInfo.isDisabled) {
                this._processors.push({
                    name: modulePath,
                    order: processorInfo.order,
                    handler: processorInfo.handler
                });
            }
        }
        this._processors = the_lodash_1.default.orderBy(this._processors, function (x) { return x.order; });
        for (var _a = 0, _b = this._processors; _a < _b.length; _a++) {
            var processor = _b[_a];
            this._logger.info("[_extractProcessors] HANDLER: %s :: %s", processor.order, processor.name);
        }
    };
    SnapshotProcessor.prototype.process = function (registryState, rules, tracker) {
        var _this = this;
        var ruleEngineResult = {
            rules: {},
            markers: {}
        };
        var bundle = null;
        return the_promise_1.Promise.resolve()
            .then(function () { return _this._runProcessors(registryState, rules, ruleEngineResult, tracker); })
            .then(function () {
            return tracker.scope("buildBundle", function () {
                bundle = registryState.buildBundle();
            });
        })
            .then(function () {
            return {
                bundle: bundle,
                ruleEngineResult: ruleEngineResult
            };
        });
    };
    SnapshotProcessor.prototype._runProcessors = function (registryState, rules, ruleEngineResult, tracker) {
        var _this = this;
        return tracker.scope("handlers", function (procTracker) {
            return the_promise_1.Promise.serial(_this._processors, function (processor) {
                return procTracker.scope(processor.name, function (innerTracker) {
                    var params = {
                        logger: _this.logger,
                        context: _this._context,
                        state: registryState,
                        rules: rules,
                        ruleEngineResult: ruleEngineResult,
                        tracker: innerTracker
                    };
                    return processor.handler(params);
                });
            });
        });
    };
    return SnapshotProcessor;
}());
exports.SnapshotProcessor = SnapshotProcessor;
//# sourceMappingURL=index.js.map