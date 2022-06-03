import { ILogger } from 'the-logger';
import _ from 'the-lodash';
import { Promise } from 'the-promise';

import { Context } from '../../context'

import { ExecutorCounters, ExecutorTarget, ExecutorTaskTarget } from './types';
import { ExecutorTask } from './executor-task';
import { StopWatch } from '@kubevious/helper-backend';
import { BackendMetricItem } from '@kubevious/ui-middleware';
import { ValidationState, ValidationStateRow } from '@kubevious/data-models/dist/models/guard';

export class Executor
{
    private _logger : ILogger;
    private _context : Context;

    private _counters : ExecutorCounters ;

    constructor(context : Context)
    {
        this._context = context;
        this._logger = context.logger.sublogger('Executor');

        this._counters = {
            processStartCount: 0,
            processCompleteCount: 0,
            processFailCount: 0,
            recentDurations: []
        };
    }

    get logger() {
        return this._logger;
    }

    process(target: ExecutorTarget) //: Promise<any>
    {
        this._logger.info("[process] ChangeId: %s", target.changeId);

        const stopwatch = new StopWatch();

        this._counters.processStartCount++;

        return Promise.resolve()
            .then(() => {
                return this._context.jobStatusUpdater.notifyIntermediateState({
                    change_id: target.changeId,
                    date: new Date(),
                    state: ValidationState.running
                });
            })
            .then(() => this._context.snapshotMonitor.fetchCurrentRegistry())
            .then(concreteRegistry => {

                if (!concreteRegistry)
                {
                    this._logger.error("[process] Missing concreteRegistry.");
                    return this._markFailure(target);
                }
            
                const taskTarget : ExecutorTaskTarget = {
                    changeId: target.changeId,
                    registry: concreteRegistry,
                    snapshotIdStr: concreteRegistry.snapshotId
                }

                return this._context.tracker.scope("executor", (innerTracker) => {
                    const task = new ExecutorTask(this._logger, this._context, taskTarget);
                    return task.execute(innerTracker)
                        .then(() => {
                            return this._markCompleted(target);
                        })
                        .catch(reason => {
                            this._logger.error("Error processing guard. Reason: ", reason);
                            this._markFailure(target);
                        })
                        .then(() => { return null; })
                })

            })
            .catch(reason => {
                this._logger.error("Error In Executor. Reason: ", reason);
                return this._markFailure(target);
            })
            .then(() => { 
                const durationMs = stopwatch.stop() / 1000;
                this._counters.recentDurations.push(durationMs);
                this._counters.recentDurations = _.takeRight(this._counters.recentDurations, 10);
            })
    }

    extractMetrics()
    {
        const metrics : BackendMetricItem[] = [];

        metrics.push({
            category: 'Guard',
            name: 'Process Start Counter',
            value: this._counters.processStartCount
        })

        metrics.push({
            category: 'Guard',
            name: 'Process Complete Counter',
            value: this._counters.processCompleteCount
        })

        metrics.push({
            category: 'Guard',
            name: 'Process Fail Counter',
            value: this._counters.processFailCount
        })

        metrics.push({
            category: 'Guard',
            name: 'Executor Process Durations',
            value: JSON.stringify(this._counters.recentDurations)
        })

        return metrics;
    }

    private _markCompleted(target: ExecutorTarget)
    {
        this.logger.info("[_markCompleted] Target: ", target);

        this._counters.processCompleteCount++;

        return Promise.resolve()
            .then(() => {
                return this._context.jobStatusUpdater.notifyFinalState(target.changeId);
            })
            .then(() => null)
    }

    private _markFailure(target: ExecutorTarget)
    {
        this.logger.info("[_markFailure] Target: ", target);
        
        this._counters.processFailCount++;

        return Promise.resolve()
            .then(() => {
                const row : ValidationStateRow = {
                    change_id: target.changeId,
        
                    date: new Date(),
                    state: ValidationState.failed
                }
        
                return this._context.dataStore.table(this._context.dataStore.guard.ValidationState)
                    .create(row)
            })
            .then(() => {
                return this._context.jobStatusUpdater.notifyFinalState(target.changeId);
            })
    }

    // private _markComplete(target: ExecutorTarget, stopwatch: StopWatch)
    // {
    //     this._counters.processCount++;
        
    //     {
    //         const durationMs = stopwatch.stop() / 1000;
    //         this._counters.recentDurations.push(durationMs);
    //         this._counters.recentDurations = _.takeRight(this._counters.recentDurations, 10);
    //     }
    // }

}