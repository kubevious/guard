import { ValidationHistoryRow } from "@kubevious/data-models/dist/models/guard";
import { ILogger } from "the-logger";
import { Context } from "../../context";
import { Database } from "../../db";

export class JobStatusUpdater
{
    private _logger : ILogger;
    private _context : Context;
    private _dataStore : Database;

    constructor(context : Context)
    {
        this._context = context;
        this._logger = context.logger.sublogger("JobStatusUpdater");

        this._dataStore = context.dataStore;
    }

    get logger() {
        return this._logger;
    }

    persistStatus(row: ValidationHistoryRow)
    {
        return this._dataStore.table(this._dataStore.guard.ValidationHistory)
            .create(row)
    }
}