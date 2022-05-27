"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebServer = void 0;
var path_1 = __importDefault(require("path"));
var helper_backend_1 = require("@kubevious/helper-backend");
var WebServer = /** @class */ (function () {
    function WebServer(context) {
        this.logger = context.logger.sublogger('WebServer');
        this.helpers = {};
        this.server = new helper_backend_1.Server(this.logger, context, this.helpers, {
            routersDir: path_1.default.join(__dirname, '..', 'routers')
        });
        this.server.initializer(function (app) {
            app.set('trust proxy', true);
        });
    }
    Object.defineProperty(WebServer.prototype, "httpServer", {
        get: function () {
            return this.server.httpServer;
        },
        enumerable: false,
        configurable: true
    });
    WebServer.prototype.run = function () {
        this.server.initializer(function (app) {
            // TODO: To be called after load Routers (a post-initializer)
            // this._app.use((req, res, next) => {
            //     res.status(404).json({
            //         status: 404,
            //         message: 'Not Found'
            //     });
            // });
        });
        return this.server.run();
    };
    return WebServer;
}());
exports.WebServer = WebServer;
//# sourceMappingURL=index.js.map