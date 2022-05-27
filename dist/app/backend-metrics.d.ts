import { ILogger } from "the-logger";
import { Context } from "../context";
import { BackendMetricItem } from '@kubevious/ui-middleware';
export declare class BackendMetrics {
    private _logger;
    private _context;
    constructor(context: Context);
    get logger(): ILogger;
    extractMetrics(): BackendMetricItem[];
}
//# sourceMappingURL=backend-metrics.d.ts.map