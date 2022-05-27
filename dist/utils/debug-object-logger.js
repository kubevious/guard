"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DebugObjectLogger = void 0;
var the_lodash_1 = __importDefault(require("the-lodash"));
var DebugObjectLogger = /** @class */ (function () {
    function DebugObjectLogger(context) {
        this._logger = context.logger;
    }
    DebugObjectLogger.prototype.dump = function (name, iteration, obj) {
        if (!process.env.LOG_TO_FILE) {
            return;
        }
        if (!obj) {
            return;
        }
        var writer = this._logger.outputStream(name + iteration + ".json");
        if (writer) {
            writer.write(the_lodash_1.default.cloneDeep(obj));
            writer.close();
        }
    };
    return DebugObjectLogger;
}());
exports.DebugObjectLogger = DebugObjectLogger;
//# sourceMappingURL=debug-object-logger.js.map