"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var helper_backend_1 = require("@kubevious/helper-backend");
var the_logger_1 = require("the-logger");
var context_1 = require("./context");
var backend = new helper_backend_1.Backend("guard", {
    logLevels: {
        'DriverMysql': the_logger_1.LogLevel.warn
    }
});
new context_1.Context(backend);
backend.run();
//# sourceMappingURL=index.js.map