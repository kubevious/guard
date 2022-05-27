"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqlBuilder = exports.MigratorBuilder = exports.Migrator = void 0;
function Migrator() {
    return new MigratorBuilder();
}
exports.Migrator = Migrator;
var MigratorBuilder = /** @class */ (function () {
    function MigratorBuilder() {
        this._data = {};
    }
    MigratorBuilder.prototype.handler = function (value) {
        this._data.handler = value;
        return this;
    };
    MigratorBuilder.prototype._export = function () {
        if (!this._data.handler) {
            throw new Error("Handler not set.");
        }
        return this._data;
    };
    return MigratorBuilder;
}());
exports.MigratorBuilder = MigratorBuilder;
var SqlBuilder = /** @class */ (function () {
    function SqlBuilder() {
    }
    SqlBuilder.prototype.dropTable = function (name) {
        return "DROP TABLE IF EXISTS `".concat(name, "`");
    };
    SqlBuilder.prototype.createTable = function (name, params) {
        var columnsStr = [];
        var sql = "CREATE TABLE IF NOT EXISTS `".concat(name, "` ( ");
        for (var _i = 0, _a = params.columns; _i < _a.length; _i++) {
            var column = _a[_i];
            columnsStr.push("`".concat(column.name, "` ").concat(column.type, " ").concat(column.options));
        }
        {
            var pks = params.columns.filter(function (x) { return x.isPrimaryKey; }).map(function (x) { return x.name; });
            var pksStr = pks.map(function (x) { return "`".concat(x, "`"); });
            columnsStr.push("PRIMARY KEY (".concat(pksStr, ")"));
        }
        {
            for (var _b = 0, _c = params.columns; _b < _c.length; _b++) {
                var column = _c[_b];
                if (column.isIndexed && !column.isPrimaryKey) {
                    columnsStr.push("KEY `".concat(column.name, "` (`").concat(column.name, "`)"));
                }
            }
        }
        sql += columnsStr.join(', ');
        sql += ") ENGINE=InnoDB CHARACTER SET utf8 COLLATE utf8_general_ci ";
        if (params.isPartitioned) {
            sql +=
                "PARTITION BY RANGE (`part`) ( " +
                    "PARTITION p0 VALUES LESS THAN (0) " +
                    ")";
        }
        sql += ';';
        return sql;
    };
    return SqlBuilder;
}());
exports.SqlBuilder = SqlBuilder;
//# sourceMappingURL=migration.js.map