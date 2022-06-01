import _ from 'the-lodash';
import { Promise, Resolvable } from 'the-promise';
import { ILogger } from 'the-logger' ;

import { DataStore, DataStoreTableAccessor, MySqlDriver } from '@kubevious/easy-data-store';

import { Context } from '../context' ;

import { ConfigAccessors, prepareConfig } from '@kubevious/data-models/dist/models/config'
import { SnapshotsAccessors, prepareSnapshots } from '@kubevious/data-models/dist/models/snapshots'
import { RuleEngineAccessors, prepareRuleEngine } from '@kubevious/data-models/dist/models/rule_engine'
import { ValidationAccessors, prepareValidation } from '@kubevious/data-models/dist/models/validation'
import { LogicStoreAccessors, prepareLogicStore } from '@kubevious/data-models/dist/models/logic-store'
import { GuardAccessors, prepareGuard } from '@kubevious/data-models/dist/models/guard'

const DB_NAME = process.env.MYSQL_DB;
export class Database
{
    private _logger : ILogger;
    private _context : Context

    private _dataStore : DataStore;
    private _driver? : MySqlDriver;

    private _config : ConfigAccessors;
    private _snapshots : SnapshotsAccessors;
    private _ruleEngine : RuleEngineAccessors;
    private _validation : ValidationAccessors;
    private _logicStore : LogicStoreAccessors;
    private _guard : GuardAccessors;

    constructor(logger : ILogger, context : Context)
    {
        this._context = context;
        this._logger = logger.sublogger("DB");

        this._dataStore = new DataStore(logger.sublogger("DataStore"), false);

        this._config = prepareConfig(this._dataStore);
        this._snapshots = prepareSnapshots(this._dataStore);
        this._ruleEngine = prepareRuleEngine(this._dataStore);
        this._validation = prepareValidation(this._dataStore);
        this._logicStore = prepareLogicStore(this._dataStore);
        this._guard = prepareGuard(this._dataStore);
    }

    get logger() {
        return this._logger;
    }

    get dataStore() {
        return this._dataStore;
    }

    get driver() {
        return this._driver!;
    }

    get isConnected() {
        return this._dataStore.isConnected;
    }

    get config() {
        return this._config;
    }

    get snapshots() {
        return this._snapshots;
    }

    get ruleEngine() {
        return this._ruleEngine;
    }

    get validation() {
        return this._validation;
    }

    get logicStore() {
        return this._logicStore;
    }

    get guard() {
        return this._guard;
    }

    onConnect(cb: () => Resolvable<any>)
    {
        return this._driver!.onConnect(cb);
    }

    table<TRow>(accessor: DataStoreTableAccessor<TRow>)
    {
        return this._dataStore.table(accessor);
    }

    executeInTransaction<T = any>(tables: (string | DataStoreTableAccessor<any>)[], cb: () => Resolvable<T>): Promise<any>
    {
        return this._dataStore.executeInTransaction(tables, cb);
    }

    init()
    {
        this._logger.info("[init]")

        return Promise.resolve()
            .then(() => this._dataStore.init())
            .then(() => {
                this._driver = this._dataStore.mysql!.databaseClients.find(x => x.name === DB_NAME)!.client;
            })
            .then(() => {
                this._logger.info("[init] post connect.")
            })
    }

}