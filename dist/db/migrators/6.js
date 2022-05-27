"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var the_promise_1 = require("the-promise");
var migration_1 = require("../migration");
exports.default = (0, migration_1.Migrator)()
    .handler(function () {
    return the_promise_1.Promise.resolve();
});
//# sourceMappingURL=6.js.map