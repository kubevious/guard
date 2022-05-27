"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketKind = exports.WebSocketUpdater = void 0;
var http_client_1 = require("@kubevious/http-client");
var WebSocketUpdater = /** @class */ (function () {
    function WebSocketUpdater(context) {
        this._context = context;
        this._logger = context.logger.sublogger('SnapshotProcessor');
        var baseUrl = process.env.BACKEND_BASE_URL;
        if (!baseUrl) {
            throw new Error("ENV BACKEND_BASE_URL not set.");
        }
        this._backendClient = new http_client_1.HttpClient(baseUrl);
    }
    Object.defineProperty(WebSocketUpdater.prototype, "logger", {
        get: function () {
            return this._logger;
        },
        enumerable: false,
        configurable: true
    });
    WebSocketUpdater.prototype.notifyNewSnapshot = function () {
        var body = {
            items: [
                { target: WebSocketKind.latest_snapshot_id },
                { target: WebSocketKind.rules_statuses },
                { target: WebSocketKind.rule_result },
                { target: WebSocketKind.markers_statuses },
                { target: WebSocketKind.marker_result },
            ]
        };
        return this._notifySocket(body);
    };
    WebSocketUpdater.prototype.notifyReporter = function () {
        var body = {
            items: [
                { target: WebSocketKind.cluster_reporting_status },
            ]
        };
        return this._notifySocket(body);
    };
    WebSocketUpdater.prototype._notifySocket = function (body) {
        return this._backendClient.post('/api/internal/socket/report', {}, body);
    };
    return WebSocketUpdater;
}());
exports.WebSocketUpdater = WebSocketUpdater;
var WebSocketKind;
(function (WebSocketKind) {
    WebSocketKind["node"] = "node";
    WebSocketKind["children"] = "children";
    WebSocketKind["props"] = "props";
    WebSocketKind["alerts"] = "alerts";
    WebSocketKind["latest_snapshot_id"] = "latest_snapshot_id";
    WebSocketKind["rules_list"] = "rules-list";
    WebSocketKind["rules_statuses"] = "rules-statuses";
    WebSocketKind["rule_result"] = "rule-result";
    WebSocketKind["markers_list"] = "markers-list";
    WebSocketKind["markers_statuses"] = "markers-statuses";
    WebSocketKind["marker_result"] = "marker-result";
    WebSocketKind["cluster_reporting_status"] = "cluster_reporting_status";
})(WebSocketKind = exports.WebSocketKind || (exports.WebSocketKind = {}));
//# sourceMappingURL=websocket-updater.js.map