"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var the_promise_1 = require("the-promise");
var migration_1 = require("../migration");
exports.default = (0, migration_1.Migrator)()
    .handler(function (_a) {
    var logger = _a.logger, executeSql = _a.executeSql, sql = _a.sql;
    var queries = [
        sql.createTable('logic_item_data', {
            columns: [
                { name: 'id', type: 'INT UNSIGNED', options: 'NOT NULL AUTO_INCREMENT', isPrimaryKey: true },
                { name: 'dn', type: 'VARCHAR(1024)', options: 'NOT NULL' },
                { name: 'key', type: 'VARCHAR(128)', options: 'NOT NULL' },
                { name: 'value', type: 'JSON', options: 'NOT NULL' },
            ]
        }),
    ];
    return the_promise_1.Promise.serial(queries, function (x) { return executeSql(x); });
});
//# sourceMappingURL=10.js.map