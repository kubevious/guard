"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var the_promise_1 = require("the-promise");
var migration_1 = require("../migration");
exports.default = (0, migration_1.Migrator)()
    .handler(function (_a) {
    var logger = _a.logger, executeSql = _a.executeSql, sql = _a.sql;
    var queries = [
        sql.createTable('guard_change_packages', {
            columns: [
                { name: 'namespace', type: 'VARCHAR(128)', options: 'NOT NULL', isPrimaryKey: true },
                { name: 'name', type: 'VARCHAR(512)', options: 'NOT NULL', isPrimaryKey: true },
                { name: 'date', type: 'DATETIME', options: 'NOT NULL' },
                { name: 'summary', type: 'JSON', options: 'NOT NULL' },
                { name: 'charts', type: 'JSON', options: 'NOT NULL' },
                { name: 'changes', type: 'JSON', options: 'NOT NULL' },
                { name: 'deletions', type: 'JSON', options: 'NOT NULL' },
            ]
        }),
        sql.createTable('guard_validation_states', {
            columns: [
                { name: 'namespace', type: 'VARCHAR(128)', options: 'NOT NULL', isPrimaryKey: true },
                { name: 'name', type: 'VARCHAR(512)', options: 'NOT NULL', isPrimaryKey: true },
                { name: 'date', type: 'DATETIME', options: 'NOT NULL' },
                { name: 'state', type: 'VARCHAR(128)', options: 'NOT NULL' },
                { name: 'success', type: 'TINYINT', options: 'NULL' },
                { name: 'summary', type: 'JSON', options: 'NULL' },
                { name: 'issues', type: 'JSON', options: 'NULL' },
            ]
        }),
    ];
    return the_promise_1.Promise.serial(queries, function (x) { return executeSql(x); });
});
//# sourceMappingURL=11.js.map