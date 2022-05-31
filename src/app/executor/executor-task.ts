import _ from 'the-lodash';
import { ILogger } from 'the-logger';
import { Promise } from 'the-promise';

import * as Path from 'path';

import { LogicProcessor } from '@kubevious/helper-logic-processor'
import { ProcessingTrackerScoper } from '@kubevious/helper-backend';
import { RegistryState, RegistryBundleState, SnapshotConfigKind } from '@kubevious/state-registry';

import { Context } from '../../context'
import { ExecutorTaskTarget } from './types';

import { DBSnapshot } from '../reader/snapshot';
import { PersistableSnapshot } from './persistable-snapshot';

import { BufferUtils } from '@kubevious/data-models';
import { ExecutionContext as RuleEngineExecutionContext } from '@kubevious/helper-rule-engine';
import { ValidationConfig } from '@kubevious/entity-meta';
import { RecentBaseSnapshotReader } from '../reader/recent-base-snapshot-reader';
import { MarkerObject, RuleObject } from '../../rule/types';
import { PersistenceItem } from '@kubevious/helper-logic-processor/dist/store/presistence-store';

export class ExecutorTask
{
    private _context : Context;
    private _logger : ILogger;
    private _target: ExecutorTaskTarget;

    private _snapshotIdStr: string;
    
    private _targetBundleState? : RegistryBundleState;
    private _targetSnapshot? : PersistableSnapshot;

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

                    this._targetSnapshot = this._produceSnapshot(result.bundle);
                    this.logger.info("SnapshotProcessor Target Item Count: %s", this._targetSnapshot.snapItemCount)
                    this.logger.info("SnapshotProcessor Target Partition: %s", this._targetSnapshot.partitionId)

                    this._ruleEngineResult = result.ruleEngineResult;

                    return Promise.resolve()
                        .then(() => this._outputFile(`snapshot-processor-rules-engine-result.json`, result.ruleEngineResult))
                        .then(() => this._outputFile(`target-snapshot.json`, this._targetSnapshot!.export()));
                })
        });
    }


    private _notifyWebSocket(tracker: ProcessingTrackerScoper)
    {
        return tracker.scope("notify-websocket", (innerTracker) => {

            return this._context.webSocketUpdater.notifyNewSnapshot();
            
        });
    }

    private _produceSnapshot(state: RegistryBundleState) : PersistableSnapshot
    {
        const snapshot = new PersistableSnapshot(this._target.snapshotId, state.date);
        
        this._logger.info("[_produceSnapshot] date: %s, count: %s", snapshot.date.toISOString(), state.getCount());

        for(const node of state.nodeItems)
        {
            {
                const configHash = snapshot.addConfig(node.config);

                snapshot.addItem({
                    config_kind: SnapshotConfigKind.node,
                    dn: node.dn,
                    kind: node.kind,
                    config_hash: configHash
                });
                
                snapshot.addNodeConfig(node.dn, node.config);
            }

            {
                const childrenNodes = state.getChildren(node.dn);
                if (childrenNodes.length > 0)
                {
                    let childrenRns = childrenNodes.map(x => x.rn);
                    childrenRns = childrenRns.sort();

                    const configHash = snapshot.addConfig(childrenRns);

                    snapshot.addItem({
                        config_kind: SnapshotConfigKind.children,
                        dn: node.dn,
                        kind: node.kind,
                        config_hash: configHash
                    });
                }
            }
            
            {
                for(const props of _.values(node.propertiesMap))
                {
                    const configHash = snapshot.addConfig(props);

                    snapshot.addItem({
                        config_kind: SnapshotConfigKind.props,
                        dn: node.dn,
                        kind: node.kind,
                        name: props.id,
                        config_hash: configHash
                    });
                }
            }

            {
                if (node.selfAlerts.length > 0)
                {
                    const configHash = snapshot.addConfig(node.selfAlerts);

                    snapshot.addItem({
                        config_kind: SnapshotConfigKind.alerts,
                        dn: node.dn,
                        kind: node.kind,
                        config_hash: configHash
                    });
                }
            }
        }

        return snapshot;
    }


    private _produceDeltaSnapshot(sourceSnapshot: DBSnapshot) : PersistableSnapshot
    {
        if (sourceSnapshot.snapshotId) {
            this._logger.info('[_produceDeltaSnapshot] Begin, SourceID: %s', BufferUtils.toStr(sourceSnapshot.snapshotId!) );
        } else {
            this._logger.info('[_produceDeltaSnapshot] Begin, No SourceID.');
        }

        const targetDbSnapshot = this._targetSnapshot!.dbSnapshot;
        const diffSnapshot = this._targetSnapshot!.constructDiff(sourceSnapshot.snapshotId!);

        this._logger.info('[_produceDeltaSnapshot] baseSnapshot size: %s', sourceSnapshot.count);
        this._logger.info('[_produceDeltaSnapshot] targetDbSnapshot size: %s', targetDbSnapshot.count);

        for(const key of targetDbSnapshot.keys)
        {
            const item = targetDbSnapshot.findById(key)!;
            const baseItem = sourceSnapshot.findById(key);
            if (baseItem)
            {
                if (!BufferUtils.areEqual(item.config_hash!, baseItem.config_hash!))
                {
                    diffSnapshot.addDiffItem({
                        dn: item.dn!,
                        kind: item.kind!,
                        config_kind: item.config_kind!,
                        name: item.name,
                        config_hash: item.config_hash!,
                        present: true
                    })
                }
            }
            else
            {
                diffSnapshot.addDiffItem({
                    dn: item.dn!,
                    kind: item.kind!,
                    config_kind: item.config_kind!,
                    name: item.name,
                    config_hash: item.config_hash!,
                    present: true
                })
            }
        }

        for(const key of sourceSnapshot.keys)
        {
            const item = targetDbSnapshot.findById(key);
            if (!item)
            {
                const baseItem = sourceSnapshot.findById(key)!;

                diffSnapshot.addDiffItem({
                    dn: baseItem.dn!,
                    kind: baseItem.kind!,
                    config_kind: baseItem.config_kind!,
                    name: baseItem.name,
                    present: false
                })
            }
        }

        return diffSnapshot;
    }

    private _calculateDiffPercentage(deltaSnapshot: PersistableSnapshot) : number
    {
        if (!deltaSnapshot.dbSnapshot.snapshotId) {
            return 0;
        }

        if (this._targetSnapshot!.snapItemCount == 0) {
            return 0;
        }

        return Math.round(deltaSnapshot.diffItemCount * 100 / this._targetSnapshot!.snapItemCount);
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

interface DeltaSnapshotInfo
{
    deltaChangePerc: number,
    snapshot: PersistableSnapshot
}