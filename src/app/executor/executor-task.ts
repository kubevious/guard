import _ from 'the-lodash';
import { ILogger } from 'the-logger';
import { Promise } from 'the-promise';

import * as Path from 'path';

import { extractK8sConfigId, LogicProcessor } from '@kubevious/helper-logic-processor'
import { ProcessingTrackerScoper } from '@kubevious/helper-backend';
import { RegistryState, RegistryBundleState, Alert } from '@kubevious/state-registry';

import { Context } from '../../context'
import { ExecutorTaskTarget } from './types';

import { ValidationConfig } from '@kubevious/entity-meta';
import { PersistenceItem } from '@kubevious/helper-logic-processor/dist/store/presistence-store';
import { ConcreteRegistry } from '../../concrete/registry';
import { ChangePackageRow, ValidationState, ValidationStateRow } from '@kubevious/data-models/dist/models/guard';
import { ValidationIssues, ValidationObjectIssues, ValidationStateAlerts, ValidationStateSummary } from '@kubevious/ui-middleware/dist/entities/guard';
import { Database } from '../../db';
import { RuleObject } from '@kubevious/helper-rule-engine';

export class ExecutorTask
{
    private _context : Context;
    private _logger : ILogger;
    private _target: ExecutorTaskTarget;
    private _dataStore : Database;

    private _snapshotIdStr: string;
    
    private _rules? : RuleObject[];
    private _changePackageRow?: Partial<ChangePackageRow>;

    private _validationConfig: Partial<ValidationConfig> = {};
    private _logicStoreItems : PersistenceItem[] = [];

    private _baselineStage?: ProcessingStage;
    private _changeStage?: ProcessingStage;

    private _summary?: ValidationStateSummary;
    private _newIssues?: ValidationIssues;
    private _clearedIssues?: ValidationIssues;

    constructor(logger: ILogger, context : Context, target: ExecutorTaskTarget)
    {
        this._logger = logger;
        this._context = context;        
        this._target = target;
        this._dataStore = context.dataStore;

        this._snapshotIdStr = target.snapshotIdStr;

        this.logger.info('snapshot: %s', this._snapshotIdStr);
    }

    get logger() {
        return this._logger;
    }

    execute(tracker: ProcessingTrackerScoper)
    {
        this.logger.info("[execute] Begin");

        return Promise.resolve()
            .then(() => this._queryValidatorConfig(tracker))
            .then(() => this._queryRules(tracker))
            .then(() => this._queryChangePackage(tracker))
            // .then(() => this._queryMarkers(tracker))
            // .then(() => this._queryLogicStore(tracker))
            .then(() => this._processBaseline(tracker))
            .then(() => this._processChange(tracker))
            .then(() => this._processAlerts(tracker))
            .then(() => this._persist(tracker))
            // .then(() => this._notifyWebSocket(tracker))
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
                .then(() => this._outputFile(`validator-config.json`, this._validationConfig));

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
                            target: x.target!,
                            script: x.script!
                        }
                        return rule;
                    });
                });

        });
    }

    private _queryChangePackage(tracker: ProcessingTrackerScoper)
    {
        return tracker.scope("query-change-package", (innerTracker) => {

            return this._context.dataStore.table(this._context.dataStore.guard.ChangePackage)
                .queryOne({ 
                    namespace: this._target.job.namespace,
                    name: this._target.job.name,
                })
                .then(row => {
                    if (!row) {
                        throw new Error('Missing change package');
                    }
                    this._changePackageRow = row;
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

    private _processBaseline(tracker: ProcessingTrackerScoper)
    {
        return tracker.scope("baseline", (innerTracker) => {

            this._baselineStage = {
                concreteRegistry: this._target.registry,
                alerts: {}
            }

            return Promise.resolve()
                .then(() => this._processStage(this._baselineStage!, innerTracker))
                .then(() => this._outputFile(`baseline-alerts.json`, this._baselineStage!.alerts));

                ;

        });
    }

    private _processChange(tracker: ProcessingTrackerScoper)
    {
        return tracker.scope("change", (innerTracker) => {

            const concreteRegistry = this._target.registry.clone();
            for(const k8sObj of this._changePackageRow!.changes!)
            {
                const itemId = extractK8sConfigId(k8sObj);
                concreteRegistry.add(itemId, k8sObj);
            }

            this._changeStage = {
                concreteRegistry: concreteRegistry,
                alerts: {}
            }

            return Promise.resolve()
                .then(() => this._processStage(this._changeStage!, innerTracker))
                .then(() => this._outputFile(`change-alerts.json`, this._changeStage!.alerts));
                ;
                
        });
    }

    private _processAlerts(tracker: ProcessingTrackerScoper)
    {
        return tracker.scope("process-alerts", (innerTracker) => {

            if (!this._baselineStage?.alerts) {
                throw new Error("Missing baseline alerts");
            }

            if (!this._changeStage?.alerts) {
                throw new Error("Missing change alerts");
            }

            this._newIssues = this._buildAlertsDiff(this._changeStage?.alerts, this._baselineStage?.alerts);
            this._clearedIssues = this._buildAlertsDiff(this._baselineStage?.alerts, this._changeStage?.alerts);

            this._summary = {
                issues: {
                    raised: this._buildIssueSummary(this._newIssues),
                    cleared: this._buildIssueSummary(this._clearedIssues),
                }
            }

            return Promise.resolve()
                .then(() => this._outputFile(`new-alerts.json`, this._newIssues))
                .then(() => this._outputFile(`cleared-alerts.json`, this._clearedIssues))
                .then(() => this._outputFile(`summary.json`, this._summary))
        });
    }

    private _persist(tracker: ProcessingTrackerScoper)
    {
        return tracker.scope("persist", (innerTracker) => {

            const date = new Date();

            return Promise.resolve()
                .then(() => this._persistState(date))
                ;
        });
    }

    private _persistState(date: Date)
    {
        if (!this._summary) {
            throw new Error("Missing summary");
        }

        const success = 
            (this._summary.issues.raised.errors + this._summary.issues.raised.warnings) > 0;

        const row : ValidationStateRow = {
            namespace: this._target.job.namespace,
            name: this._target.job.name,

            date: date,
            state: ValidationState.completed,
            success: success,

            summary: this._summary,
            newIssues: this._newIssues,
            clearedIssues: this._clearedIssues,
        }

        return this._dataStore.table(this._dataStore.guard.ValidationState)
            .create(row)
    }

    private _buildAlertsDiff(newAlerts: ProcessingAlertsDict, oldAlerts: ProcessingAlertsDict)
    {
        const diff : ValidationIssues = [];

        for(const dn of _.keys(newAlerts))
        {
            const newAlertsObj = newAlerts[dn];
            const oldAlertsObj = oldAlerts[dn];

            if (oldAlertsObj)
            {
                let diffObjItem : ValidationObjectIssues | null = null;

                for(const key of _.keys(newAlertsObj))
                {
                    if (!oldAlertsObj[key]) {
                        if (!diffObjItem) {
                            diffObjItem = {
                                dn: dn,
                                alerts: []
                            }
                            diff.push(diffObjItem!);
                        }
                        diffObjItem.alerts.push(newAlertsObj[key]);
                    }
                }
            }
            else
            {
                diff.push({
                    dn: dn,
                    alerts: _.values(newAlertsObj)
                });
            }
        }

        return diff;
    }

    private _buildIssueSummary(issues : ValidationIssues) : ValidationStateAlerts
    {
        const counter : ValidationStateAlerts = {
            errors: 0,
            warnings: 0
        }

        for(const x of _.values(issues))
        {
            for(const alert of x.alerts)
            {
                if (alert.severity === 'error') {
                    counter.errors ++;
                } else if (alert.severity === 'warn') {
                    counter.warnings ++;
                }
            }
        }

        return counter;
    }

    private _processStage(stage: ProcessingStage, tracker: ProcessingTrackerScoper)
    {
        return Promise.resolve()
            .then(() => this._executeLogicProcessor(stage, tracker))
            .then(() => this._executeSnapshotProcessor(stage, tracker))
            .then(() => this._extractAlerts(stage, tracker))
            ;
    }

    private _executeLogicProcessor(stage: ProcessingStage, tracker: ProcessingTrackerScoper)
    {
        return tracker.scope("logic-processor", (innerTracker) => {

            if (!stage.concreteRegistry) {
                throw new Error("Could not produce concreteRegistry");
            }

            const logicProcessor = new LogicProcessor(
                this.logger,
                innerTracker,
                this._context.parserLoader,
                stage.concreteRegistry,
                this._validationConfig);
            logicProcessor.store.loadItems(this._logicStoreItems);

            return logicProcessor.process()
                .then(registryState => {
                    this.logger.info("[_executeLogicProcessor] End. Node Count: %s", registryState.getNodes().length)

                    stage.registryState = registryState;
                })

        });
    }

    private _executeSnapshotProcessor(stage: ProcessingStage, tracker: ProcessingTrackerScoper)
    {
        return tracker.scope("snapshot-processor", (innerTracker) => {

            if (!stage.registryState) {
                throw new Error("Could not produce registryState");
            }
            
            return this._context.snapshotProcessor.process(stage.registryState, this._rules!, innerTracker)
                .then(result => {
                    this.logger.info("SnapshotProcessor Complete.")
                    this.logger.info("SnapshotProcessor Count: %s", result.bundle.getCount())

                    stage.bundleState = result.bundle;

                    return Promise.resolve()
                        .then(() => this._outputFile(`snapshot-processor-rules-engine-result.json`, result.ruleEngineResult))
                })
        });
    }

    private _extractAlerts(stage: ProcessingStage, tracker: ProcessingTrackerScoper)
    {
        return tracker.scope("snapshot-processor", (innerTracker) => {

            if (!stage.bundleState) {
                throw new Error("Could not produce bundleState");
            }
            
            for(const nodeItem of stage.bundleState.nodeItems)
            {
                if (nodeItem.selfAlerts.length > 0)
                {
                    stage.alerts[nodeItem.dn] = {};
                    const nodeAlerts = stage.alerts[nodeItem.dn];
                
                    for(const alert of nodeItem.selfAlerts)
                    {
                        nodeAlerts[_.stableStringify(alert)] = alert;
                    }
                }
            }

            
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
            `change-${this._target.job.namespace}-${this._target.job.name}`,
            fileName
        )
        return this.logger.outputFile(filePath, contents)
    }

}

interface ProcessingStage
{
    concreteRegistry: ConcreteRegistry,
    registryState?: RegistryState,
    bundleState?: RegistryBundleState,

    alerts : ProcessingAlertsDict,
}

type ProcessingAlertsDict = {
    [dn: string] : {
        [alertId: string] : Alert
    }
};
