import { ILogger } from 'the-logger';
import _ from 'the-lodash';

import { Backend } from '@kubevious/helper-backend'

import { Database } from './db';
import { DebugObjectLogger } from './utils/debug-object-logger';
import { SnapshotProcessor } from './app/snapshot-processor';
import { WorldviousClient } from '@kubevious/worldvious-client';

import { RedisClient } from '@kubevious/helper-redis';

import { WebServer } from './server';

import { ParserLoader } from '@kubevious/helper-logic-processor';
import { Executor } from './app/executor/executor'

import { ConfigAccessor } from '@kubevious/data-models';

import { WebSocketUpdater } from './app/websocket-updater/websocket-updater';
import { BackendMetrics } from './app/backend-metrics';
import { SnapshotMonitor } from './app/snapshot-monitor/snapshot-monitor';
import { ValidationScheduler } from './app/validation-scheduler/validation-scheduler';


import VERSION from './version'

export class Context
{
    private _backend : Backend;
    private _logger: ILogger;
    private _worldvious : WorldviousClient;

    private _server: WebServer;

    private _dataStore: Database;
    private _redis : RedisClient;

    private _debugObjectLogger: DebugObjectLogger;

    private _executor : Executor;

    private _configAccessor : ConfigAccessor;

    private _snapshotProcessor: SnapshotProcessor;

    private _parserLoader : ParserLoader;

    private _webSocketUpdater : WebSocketUpdater;
    private _backendMetrics : BackendMetrics;

    private _snapshotMonitor : SnapshotMonitor;
    private _validationScheduler : ValidationScheduler;

    constructor(backend : Backend)
    {
        this._backend = backend;
        this._logger = backend.logger.sublogger('Context');

        this._logger.info("Version: %s", VERSION);

        this._worldvious = new WorldviousClient(this.logger, 'collector', VERSION);

        this._parserLoader = new ParserLoader(this.logger);

        this._dataStore = new Database(this._logger, this);
        this._redis = new RedisClient(this.logger.sublogger('Redis'));

        this._backendMetrics = new BackendMetrics(this);

        this._executor = new Executor(this);

        this._debugObjectLogger = new DebugObjectLogger(this);

        this._configAccessor = new ConfigAccessor(this._dataStore.dataStore, this._dataStore.config);

        this._snapshotProcessor = new SnapshotProcessor(this);

        this._snapshotMonitor = new SnapshotMonitor(this);

        this._webSocketUpdater = new WebSocketUpdater(this);

        this._validationScheduler = new ValidationScheduler(this);

        this._server = new WebServer(this);

        backend.registerErrorHandler((reason) => {
            return this.worldvious.acceptError(reason);
        });

        backend.stage("setup-worldvious", () => this._worldvious.init());

        backend.stage("setup-metrics-tracker", () => this._setupMetricsTracker());

        backend.stage("setup-db", () => this._dataStore.init());

        backend.stage("redis", () => this._redis.run());

        // TODO: Temporary
        backend.stage("setup-parser-loader", () => this._parserLoader.init());

        backend.stage("setup-snapshot-monitor", () => this._snapshotMonitor.init());

        backend.stage("setup-validation-scheduler", () => this._validationScheduler.init());

        backend.stage("setup-server", () => this._server.run());

    }

    get backend() {
        return this._backend;
    }

    get logger() {
        return this._logger;
    }

    get tracker() {
        return this.backend.tracker;
    }

    get mysqlDriver() {
        return this.database.driver;
    }

    get database() {
        return this._dataStore;
    }

    get dataStore() {
        return this._dataStore;
    }

    get redis() {
        return this._redis;
    }

    get executor() : Executor {
        return this._executor;
    }
    
    get debugObjectLogger() {
        return this._debugObjectLogger;
    }

    get configAccessor() {
        return this._configAccessor ;
    }

    get snapshotProcessor() {
        return this._snapshotProcessor;
    }

    get snapshotMonitor() {
        return this._snapshotMonitor;
    }

    get worldvious() {
        return this._worldvious;
    }

    get webSocketUpdater() {
        return this._webSocketUpdater;
    }

    get parserLoader() {
        return this._parserLoader;
    }

    get backendMetrics() {
        return this._backendMetrics;
    }

    private _setupMetricsTracker()
    {
        this.tracker.registerListener(extractedData => {
            this._worldvious.acceptMetrics(extractedData);
        })
    }

}
