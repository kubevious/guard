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
    }

    processJobs()
    {
        this._isDirty = true;
        this._tryProcessJobs();
    }

    private _tryProcessJobs()
    {
        if (this._isBusy) {
            return;
        }
        this._isDirty = false;

        Promise.resolve(null)
            .then(() => this._fetchNextJob())
            .then(job => {
                this._logger.info("JOB : ", job);

                if (job) {
                    return this._scheduleJob(job)
                        .then(() => {
                            return this.removeJobFromQueue(job);
                        })
                        .then(() => {
                            this._isBusy = false;
                        })
                }
            })
            .then(() => {
                if (this._isDirty) {
                    this._tryProcessJobs();
                }
            })
            .catch(reason => {
                this._logger.error("Something went terribly wrong: ", reason);
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
        return this._context.executor.process({
            changeId: job.change_id!
        })
    }

    private removeJobFromQueue(job: Partial<ValidationQueueRow>)
    {
        return this._dataStore.table(this._dataStore.guard.ValidationQueue)
            .deleteMany({
                change_id: job.change_id
            });
    }
}
