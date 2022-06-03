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

    notifyIntermediateState(row: ValidationHistoryRow)
    {
        return this._context.backendClient.post('/api/internal/guard/update_state', {}, row);
    }

    notifyFinalState(change_id: string)
    {
        const body = {
            change_id: change_id
        }
        return this._context.backendClient.post('/api/internal/guard/update_final_state', {}, body)

    }
}