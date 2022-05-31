import _ from 'the-lodash';
import { ILogger } from "the-logger";
import { Context } from "../context";

import { BackendMetricItem } from '@kubevious/ui-middleware'

import VERSION from '../version';


export class BackendMetrics
{
    private _logger : ILogger;
    private _context : Context;

    constructor(context : Context)
    {
        this._context = context;
        this._logger = context.logger.sublogger("BackendMetrics");
    }

    get logger() {
        return this._logger;
    }

    extractMetrics() 
    {
        const metrics: BackendMetricItem[] = [];

        metrics.push({
            category: "Guard",
            name: "Version",
            value: VERSION
        });

        metrics.push({
            category: "Guard",
            name: "MySQL Connected",
            value: this._context.dataStore.isConnected
        });

        metrics.push({
            category: "Guard",
            name: "Redis Connected",
            value: this._context.redis.isConnected
        });

        // {
        //     const newMetrics = this._context.collector.extractMetrics();
        //     metrics = _.concat(metrics, newMetrics);
        // }
        // {
        //     const newMetrics = this._context.executor.extractMetrics();
        //     metrics = _.concat(metrics, newMetrics);
        // }

        return metrics;
    }

}