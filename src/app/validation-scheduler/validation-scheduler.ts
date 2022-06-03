import { ILogger } from 'the-logger';
import _ from 'the-lodash';
import { Promise } from 'the-promise';

import { Context } from '../../context'
import { Database } from '../../db';
import { ValidationQueueRow } from '@kubevious/data-models/dist/models/guard';

export class ValidationScheduler
{
    private _logger : ILogger;
    private _context : Context;
    private _dataStore : Database;

    private _isDirty: boolean = false;
    private _isBusy: boolean = false;

    constructor(context : Context)
    {
        this._context = context;
        this._logger = context.logger.sublogger('ValidationExecutor');

        this._dataStore = context.dataStore;
    }

    init() 
    {
        this._context.dataStore.onConnect(this.processJobs.bind(this));

        this._context.backend.timerScheduler.interval(
            "scheduler",
            60* 1000,
            this._tryProcessJobs.bind(this))
    }

    processJobs()
    {
        this._isDirty = true;
        this._tryProcessJobs();
    }

    private _tryProcessJobs()
    {
        if (this._isBusy) {
            this._logger.info("[_tryProcessJobs] is busy. skipping...");
            return;
        }
        this._isDirty = false;

        Promise.resolve(null)
            .then(() => this._fetchNextJob())
            .then(job => {
                if (job) {
                    this._logger.info("[_tryProcessJobs] Job: %s", job.change_id);
                    return this._scheduleJob(job)
                        .then(() => {
                            return this.removeJobFromQueue(job);
                        })
                        .then(() => {
                            this._isBusy = false;
                        })
                } else {
                    this._logger.info("[_tryProcessJobs] Nothing to do.");
                }
            })
            .then(() => {
                this._isBusy = false;
                if (this._isDirty) {
                    this._tryProcessJobs();
                }
            })
            .catch(reason => {
                this._logger.error("Something went wrong: ", reason);
                this._isBusy = false;
            })
    }
    
    private _fetchNextJob()
    {
        return this._dataStore.table(this._dataStore.guard.ValidationQueue)
            .queryMany({})
            .then(jobs => {
                return this._pickAJob(jobs);
            })
    }

    private _pickAJob(jobs: Partial<ValidationQueueRow>[])
    {
        return _.first(jobs) || null;
    }

    private _scheduleJob(job: Partial<ValidationQueueRow>)
    {
        this._logger.info("[_scheduleJob] job: %s", job.change_id);

        return this._context.executor.process({
            changeId: job.change_id!
        })
    }

    private removeJobFromQueue(job: Partial<ValidationQueueRow>)
    {
        this._logger.info("[removeJobFromQueue] job: %s", job.change_id);
        
        return this._dataStore.table(this._dataStore.guard.ValidationQueue)
            .deleteMany({
                change_id: job.change_id
            });
    }
}
