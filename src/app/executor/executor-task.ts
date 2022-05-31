import _ from 'the-lodash';
import { ILogger } from 'the-logger';
import { Promise } from 'the-promise';

import * as Path from 'path';

import { LogicProcessor } from '@kubevious/helper-logic-processor'
import { ProcessingTrackerScoper } from '@kubevious/helper-backend';
import { RegistryState, RegistryBundleState, SnapshotConfigKind } from '@kubevious/state-registry';

import { Context } from '../../context'
import { ExecutorTaskTarget } from './types';

import { BufferUtils } from '@kubevious/data-models';
import { ExecutionContext as RuleEngineExecutionContext } from '@kubevious/helper-rule-engine';
import { ValidationConfig } from '@kubevious/entity-meta';
import { MarkerObject, RuleObject } from '../../rule/types';
import { PersistenceItem } from '@kubevious/helper-logic-processor/dist/store/presistence-store';

export class ExecutorTask
{
    private _context : Context;
    private _logger : ILogger;
    private _target: ExecutorTaskTarget;

    private _snapshotIdStr: string;
    
    private _targetBundleState? : RegistryBundleState;

    private _registryState? : RegistryState;
    private _rules? : RuleObject[];
    private _markers? : MarkerObject[];
    private _ruleEngineResult?: RuleEngineExecutionContext;

    private _validationConfig: Partial<ValidationConfig> = {};
    private _logicStoreItems : PersistenceItem[] = [];

    constructor(logger: ILogger, context : Context, target: ExecutorTaskTarget)
    {
        this._logger = logger;
        this._context = context;
        this._target = target;

        this._snapshotIdStr = BufferUtils.toStr(target.snapshotId);

        this.logger.info('snapshot: %s', this._snapshotIdStr);
    }

    get logger() {
        return this._logger;
    }

    execute(tracker: ProcessingTrackerScoper) : Promise<void>
    {
        this.logger.info("[execute] Begin");

        return Promise.resolve()
            .then(() => this._queryValidatorConfig(tracker))
            .then(() => this._queryRules(tracker))
            .then(() => this._queryMarkers(tracker))
            .then(() => this._queryLogicStore(tracker))
            .then(() => this._executeLogicProcessor(tracker))
            .then(() => this._executeSnapshotProcessor(tracker))
            .then(() => this._notifyWebSocket(tracker))
            .then(() => {})
            ;
    }


    private _queryValidatorConfig(tracker: ProcessingTrackerScoper)
    {
        return tracker.scope("query-validator-config", (innerTracker) => {

            return this._context.dataStore.table(this._context.dataStore.validation.Validator)
                .queryMany({})
                .then(rows => {
                    this._validationConfig = _.makeDict(rows, x => x.validator_id!, x => x.setting!);
                })

        });
    }

    private _queryRules(tracker: ProcessingTrackerScoper)
    {
        return tracker.scope("query-rules", (innerTracker) => {

            return this._context.dataStore.table(this._context.dataStore.ruleEngine.Rules)
                .queryMany({ enabled: true })
                .then(rows => {
                    this._rules = rows.map(x => {
                        const rule : RuleObject = {
                            name: x.name!,
                            hash: x.hash!,
                            target: x.target!,
                            script: x.script!
                        }
                        return rule;
                    });
                });

        });
    }

    private _queryMarkers(tracker: ProcessingTrackerScoper)
    {
        return tracker.scope("query-markers", (innerTracker) => {

            return this._context.dataStore.table(this._context.dataStore.ruleEngine.Markers)
                .queryMany({})
                .then(rows => {
                    this._markers = rows.map(x => {
                        const marker : MarkerObject = {
                            name: x.name!
                        }
                        return marker;
                    });
                });

        });
    }

    private _queryLogicStore(tracker: ProcessingTrackerScoper)
    {
        return tracker.scope("query-logic-store", (innerTracker) => {

            return this._context.dataStore.table(this._context.dataStore.logicStore.LogicItemData)
                .queryMany({})
                .then(rows => {
                    this._logicStoreItems = rows.map(x => {
                        const item : PersistenceItem = {
                            dn: x.dn!,
                            key: x.key!,
                            value: x.value!,
                        }
                        return item;
                    });
                });

        });
    }

    private _executeLogicProcessor(tracker: ProcessingTrackerScoper)
    {
        return tracker.scope("run-logic-processor", (innerTracker) => {

            const logicProcessor = new LogicProcessor(
                this.logger,
                innerTracker,
                this._context.parserLoader,
                this._target.registry,
                this._validationConfig);
            logicProcessor.store.loadItems(this._logicStoreItems);

            return logicProcessor.process()
                .then(registryState => {
                    this.logger.info("[_executeLogicProcessor] End. Node Count: %s", registryState.getNodes().length)

                    this._registryState = registryState;

                    this._logicStoreItems = logicProcessor.store.exportItems();

                    // this.logger.info("LogicProcessor Complete.")
                    // this.logger.info("RegistryState Item Count: %s", registryState.getCount());
                })

        });
    }

    private _executeSnapshotProcessor(tracker: ProcessingTrackerScoper)
    {
        return tracker.scope("snapshot-processor", (innerTracker) => {
            
            return this._context.snapshotProcessor.process(this._registryState!, this._rules!, innerTracker)
                .then(result => {
                    this.logger.info("SnapshotProcessor Complete.")
                    this.logger.info("SnapshotProcessor Count: %s", result.bundle.getCount())

                    this._targetBundleState = result.bundle;
                    this._ruleEngineResult = result.ruleEngineResult;

                    return Promise.resolve()
                        .then(() => this._outputFile(`snapshot-processor-rules-engine-result.json`, result.ruleEngineResult))
                })
        });
    }


    private _notifyWebSocket(tracker: ProcessingTrackerScoper)
    {
        return tracker.scope("notify-websocket", (innerTracker) => {

            return this._context.webSocketUpdater.notifyNewSnapshot();
            
        });
    }

    private _outputFile(fileName: string, contents: any)
    {
        const filePath = Path.join(
            `snapshot-${this._snapshotIdStr}`,
            fileName
        )
        return this.logger.outputFile(filePath, contents)
    }

}