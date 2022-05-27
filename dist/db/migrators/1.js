"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var the_promise_1 = require("the-promise");
var migration_1 = require("../migration");
exports.default = (0, migration_1.Migrator)()
    .handler(function (_a) {
    var executeSql = _a.executeSql, sql = _a.sql;
    var queries = [
        sql.createTable('config', {
            columns: [
                { name: 'key', type: 'VARCHAR(128)', options: 'NOT NULL', isPrimaryKey: true },
                { name: 'value', type: 'JSON', options: 'NOT NULL' },
            ]
        })
    ];
    return the_promise_1.Promise.serial(queries, function (x) { return executeSql(x); });
});
//# sourceMappingURL=1.js.map