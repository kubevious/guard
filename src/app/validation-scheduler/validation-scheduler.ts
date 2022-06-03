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

    constructor(context : Context)
    {
        this._context = context;
        this._logger = context.logger.sublogger('ValidationExecutor');

        this._dataStore = context.dataStore;
    }

    init() 
    {
        this._context.dataStore.onConnect(this._refreshJobs.bind(this));
    }

    private _refreshJobs()
    {
        return this._fetchNextJob()
            .then(job => {
                this._logger.info("JOB : ", job);

                if (job) {
                    return this._scheduleJob(job)
                        .then(() => {
                            // return this.removeJobFromQueue(job);
                        })
                }
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
