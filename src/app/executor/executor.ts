import { ILogger } from 'the-logger';
import _ from 'the-lodash';
import { Promise } from 'the-promise';

import { Context } from '../../context'

import { ExecutorCounters, ExecutorTarget, ExecutorTaskTarget } from './types';
import { ExecutorTask } from './executor-task';
import { BufferUtils } from '@kubevious/data-models';
import { StopWatch } from '@kubevious/helper-backend';
import { BackendMetricItem } from '@kubevious/ui-middleware';

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
            processCount: 0,
            recentDurations: []
        };
    }

    get logger() {
        return this._logger;
    }

    process(target: ExecutorTarget) //: Promise<any>
    {
        this._logger.info("[process] JOB: ", target.job);

        return Promise.resolve()
            .then(() => this._context.snapshotMonitor.fetchCurrentRegistry())
            .then(concreteRegistry => {
                this._logger.info("[process] concreteRegistry: XXXXX");

                if (!concreteRegistry)
                {
                    return this._markFailure();
                }
                else
                {
                    const taskTarget : ExecutorTaskTarget = {
                        job: target.job,
                        registry: concreteRegistry,
                        snapshotIdStr: concreteRegistry.snapshotId
                    }

                    return this._context.tracker.scope("executor", (innerTracker) => {
                        const task = new ExecutorTask(this._logger, this._context, taskTarget);
                        return task.execute(innerTracker)
                            .catch(reason => {
                                this._logger.error("Error processing guard. Reason: ", reason);
                            });
                    });
                }
            })
            .catch(reason => {
                return this._markFailure();
            })

        // const stopwatch = new StopWatch();

        // const myTarget = this._makeTaskTarget(target);

        // return this._context.tracker.scope("executor", (innerTracker) => {
        //     const task = new ExecutorTask(this._logger, this._context, myTarget);
        //     return task.execute(innerTracker);
        // })
        // .then(() => {
        //     this._markComplete(target, stopwatch);
        // })
        // .catch((error) => {
        //     this._logger.error("[Executor] ERROR: ", error);

        //     this._markComplete(target, stopwatch);
        // })
        // ;
    }

    extractMetrics()
    {
        const metrics : BackendMetricItem[] = [];

        metrics.push({
            category: 'Collector',
            name: 'Executor Process Counter',
            value: this._counters.processCount
        })

        metrics.push({
            category: 'Collector',
            name: 'Executor Process Durations',
            value: JSON.stringify(this._counters.recentDurations)
        })

        return metrics;
    }

    private _markFailure()
    {

    }

    // private _makeTaskTarget(target: ExecutorTarget) : ExecutorTaskTarget
    // {
    //     const myTarget : ExecutorTaskTarget = {
    //         registry: target.registry,
    //         snapshotId: BufferUtils.fromStr(target.registry.snapshotId),
    //         date: target.registry.date,
    //         counters: this._counters
    //     }
    //     return myTarget;
    // }

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