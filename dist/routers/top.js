"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var version_1 = __importDefault(require("../version"));
function default_1(router, context) {
    router.url('/');
    router.get('/', function (req, res) {
        return {};
    });
    router.get('/api/v1/version', function (req, res) {
        var result = {
            version: version_1.default
        };
        return result;
    });
    router.get('/api/v1/metrics', function (req, res) {
        var metrics = context.backendMetrics.extractMetrics();
        var result = {
            metrics: metrics
        };
        return result;
    });
}
exports.default = default_1;
//# sourceMappingURL=top.js.map