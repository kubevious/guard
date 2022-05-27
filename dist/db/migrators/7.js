"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var the_promise_1 = require("the-promise");
var migration_1 = require("../migration");
exports.default = (0, migration_1.Migrator)()
    .handler(function (_a) {
    var executeSql = _a.executeSql, sql = _a.sql;
    var queries = [
        sql.createTable('notification_snooze', {
            columns: [
                { name: 'kind', type: 'VARCHAR(128)', options: 'NOT NULL', isPrimaryKey: true },
                { name: 'feedback', type: 'BINARY(16)', options: 'NOT NULL', isPrimaryKey: true },
                { name: 'snooze', type: 'DATETIME', options: 'NULL' },
            ]
        })
    ];
    return the_promise_1.Promise.serial(queries, function (x) { return executeSql(x); });
});
//# sourceMappingURL=7.js.map