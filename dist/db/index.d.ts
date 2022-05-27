/// <reference types="bluebird" />
import { Promise, Resolvable } from 'the-promise';
import { ILogger } from 'the-logger';
import { DataStore, DataStoreTableAccessor, MySqlDriver } from '@kubevious/easy-data-store';
import { Context } from '../context';
import { ConfigAccessors } from '@kubevious/data-models/dist/models/config';
import { SnapshotsAccessors } from '@kubevious/data-models/dist/models/snapshots';
import { RuleEngineAccessors } from '@kubevious/data-models/dist/models/rule_engine';
import { ValidationAccessors } from '@kubevious/data-models/dist/models/validation';
import { LogicStoreAccessors } from '@kubevious/data-models/dist/models/logic-store';
export declare class Database {
    private _logger;
    private _context;
    private _migrators;
    private _dataStore;
    private _driver?;
    private _statements;
    private _config;
    private _snapshots;
    private _ruleEngine;
    private _validation;
    private _logicStore;
    constructor(logger: ILogger, context: Context);
    get logger(): ILogger;
    get dataStore(): DataStore;
    get driver(): MySqlDriver;
    get isConnected(): boolean;
    get config(): ConfigAccessors;
    get snapshots(): SnapshotsAccessors;
    get ruleEngine(): RuleEngineAccessors;
    get validation(): ValidationAccessors;
    get logicStore(): LogicStoreAccessors;
    private _loadMigrators;
    onConnect(cb: () => Resolvable<any>): void;
    table<TRow>(accessor: DataStoreTableAccessor<TRow>): import("@kubevious/easy-data-store").ITableDriver<TRow>;
    executeInTransaction<T = any>(tables: (string | DataStoreTableAccessor<any>)[], cb: () => Resolvable<T>): Promise<any>;
    init(): import("bluebird")<void>;
    private _onDbMigrate;
    private _processMigration;
    private _processVersionMigration;
    private _migratorExecuteSql;
    private _tableExists;
    private _getDbVersion;
    private _setDbVersion;
}
//# sourceMappingURL=index.d.ts.map