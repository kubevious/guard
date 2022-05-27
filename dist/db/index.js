"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Database = void 0;
var the_lodash_1 = __importDefault(require("the-lodash"));
var the_promise_1 = require("the-promise");
var fs = __importStar(require("fs"));
var Path = __importStar(require("path"));
var easy_data_store_1 = require("@kubevious/easy-data-store");
var migration_1 = require("./migration");
var config_1 = require("@kubevious/data-models/dist/models/config");
var snapshots_1 = require("@kubevious/data-models/dist/models/snapshots");
var rule_engine_1 = require("@kubevious/data-models/dist/models/rule_engine");
var validation_1 = require("@kubevious/data-models/dist/models/validation");
var logic_store_1 = require("@kubevious/data-models/dist/models/logic-store");
var TARGET_DB_VERSION = 11;
var DB_NAME = process.env.MYSQL_DB;
var Database = /** @class */ (function () {
    function Database(logger, context) {
        this._migrators = {};
        this._statements = {};
        this._context = context;
        this._logger = logger.sublogger("DB");
        this._loadMigrators();
        this._dataStore = new easy_data_store_1.DataStore(logger.sublogger("DataStore"), false);
        this._config = (0, config_1.prepareConfig)(this._dataStore);
        this._snapshots = (0, snapshots_1.prepareSnapshots)(this._dataStore);
        this._ruleEngine = (0, rule_engine_1.prepareRuleEngine)(this._dataStore);
        this._validation = (0, validation_1.prepareValidation)(this._dataStore);
        this._logicStore = (0, logic_store_1.prepareLogicStore)(this._dataStore);
    }
    Object.defineProperty(Database.prototype, "logger", {
        get: function () {
            return this._logger;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Database.prototype, "dataStore", {
        get: function () {
            return this._dataStore;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Database.prototype, "driver", {
        get: function () {
            return this._driver;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Database.prototype, "isConnected", {
        get: function () {
            return this._dataStore.isConnected;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Database.prototype, "config", {
        get: function () {
            return this._config;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Database.prototype, "snapshots", {
        get: function () {
            return this._snapshots;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Database.prototype, "ruleEngine", {
        get: function () {
            return this._ruleEngine;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Database.prototype, "validation", {
        get: function () {
            return this._validation;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Database.prototype, "logicStore", {
        get: function () {
            return this._logicStore;
        },
        enumerable: false,
        configurable: true
    });
    Database.prototype._loadMigrators = function () {
        var location = 'migrators';
        var migratorsDir = Path.join(__dirname, location);
        var files = fs.readdirSync(migratorsDir);
        files = the_lodash_1.default.filter(files, function (x) { return x.endsWith('.d.ts'); });
        for (var _i = 0, files_1 = files; _i < files_1.length; _i++) {
            var fileName = files_1[_i];
            var moduleName = fileName.replace('.d.ts', '');
            var modulePath = location + '/' + moduleName;
            this._logger.info("Loading migrator %s from %s...", moduleName, modulePath);
            var migratorModule = require('./' + modulePath);
            var migrationBuilder = migratorModule.default;
            var migrationInfo = migrationBuilder._export();
            this._logger.info("migrationInfo: ", migrationInfo);
            this._logger.info("Loaded migrator %s from %s", moduleName, modulePath);
            this._migrators[moduleName] = migrationInfo;
        }
    };
    Database.prototype.onConnect = function (cb) {
        return this._driver.onConnect(cb);
    };
    Database.prototype.table = function (accessor) {
        return this._dataStore.table(accessor);
    };
    Database.prototype.executeInTransaction = function (tables, cb) {
        return this._dataStore.executeInTransaction(tables, cb);
    };
    Database.prototype.init = function () {
        var _this = this;
        this._logger.info("[init]");
        return the_promise_1.Promise.resolve()
            .then(function () { return _this._dataStore.init(); })
            .then(function () {
            _this._driver = _this._dataStore.mysql.databaseClients.find(function (x) { return x.name === DB_NAME; }).client;
            _this._driver.onMigrate(_this._onDbMigrate.bind(_this));
        })
            .then(function () {
            _this._logger.info("[init] post connect.");
        });
    };
    Database.prototype._onDbMigrate = function () {
        var _this = this;
        this._logger.info("[_onDbMigrate] ...");
        return the_promise_1.Promise.resolve()
            .then(function () { return _this._processMigration(); });
    };
    Database.prototype._processMigration = function () {
        var _this = this;
        this.logger.info("[_processMigration] ...");
        return this.driver.executeInTransaction(function () {
            return the_promise_1.Promise.resolve()
                .then(function () { return _this._getDbVersion(); })
                .then(function (version) {
                _this.logger.info("[_processMigration] VERSION: %s", version);
                _this.logger.info("[_processMigration] TARGET_DB_VERSION: %s", TARGET_DB_VERSION);
                if (version == TARGET_DB_VERSION) {
                    return;
                }
                if (version > TARGET_DB_VERSION) {
                    _this.logger.error("[_processMigration] You are running database version more recent then the binary. Results may be unpredictable.");
                    return;
                }
                var migrateableVersions = the_lodash_1.default.range(version + 1, TARGET_DB_VERSION + 1);
                _this.logger.info("[_processMigration] MigrateableVersions: ", migrateableVersions);
                return the_promise_1.Promise.serial(migrateableVersions, function (x) { return _this._processVersionMigration(x); });
            });
        });
    };
    Database.prototype._processVersionMigration = function (targetVersion) {
        var _this = this;
        this.logger.info("[_processVersionMigration] target version: %s", targetVersion);
        var migrator = this._migrators[targetVersion.toString()];
        if (!migrator) {
            throw new Error("Missing Migrator for db version ".concat(targetVersion));
        }
        return the_promise_1.Promise.resolve()
            .then(function () {
            var migratorArgs = {
                logger: _this.logger,
                driver: _this.driver,
                executeSql: _this._migratorExecuteSql.bind(_this),
                context: _this._context,
                sql: new migration_1.SqlBuilder()
            };
            return migrator.handler(migratorArgs);
        })
            .then(function () {
            return _this._setDbVersion(targetVersion);
        });
    };
    Database.prototype._migratorExecuteSql = function (sql, params) {
        var _this = this;
        this.logger.info("[_migratorExecuteSql] Executing: %s, params: ", sql, params);
        return this.driver.executeSql(sql, params)
            .catch(function (reason) {
            _this.logger.info("[_migratorExecuteSql] Failed. Reason: ", reason);
            throw reason;
        });
    };
    Database.prototype._tableExists = function (name) {
        return this.driver.executeSql("SHOW TABLES LIKE '".concat(name, "';"))
            .then(function (result) {
            return result.length > 0;
        });
    };
    Database.prototype._getDbVersion = function () {
        var _this = this;
        return this._tableExists('config')
            .then(function (configExists) {
            if (!configExists) {
                _this.logger.warn('[_getDbVersion] Config table does not exist.');
                return 0;
            }
            return _this._context.configAccessor.getDBSchemaVersion();
        });
    };
    Database.prototype._setDbVersion = function (version) {
        this._logger.info("[_setDbVersion] version: %s", version);
        return this._context.configAccessor.setDBSchemaVersion(version);
    };
    return Database;
}());
exports.Database = Database;
//# sourceMappingURL=index.js.map