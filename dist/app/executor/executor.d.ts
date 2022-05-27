import { ILogger } from 'the-logger';
import { Promise } from 'the-promise';
import { Context } from '../../context';
import { ExecutorTarget } from './types';
import { BackendMetricItem } from '@kubevious/ui-middleware';
export declare class Executor {
    private _logger;
    private _context;
    private _counters;
    constructor(context: Context);
    get logger(): ILogger;
    process(target: ExecutorTarget): Promise<any>;
    extractMetrics(): BackendMetricItem[];
    private _makeTaskTarget;
    private _markComplete;
}
//# sourceMappingURL=executor.d.ts.map