import { ILogger } from 'the-logger';
import { Context } from '../context';
import { ConcreteRegistry } from '../concrete/registry';
import { JobDampener } from '@kubevious/helpers';
export declare class FacadeRegistry {
    private _logger;
    private _context;
    private _jobDampener;
    private _latestDampenerState;
    constructor(context: Context);
    get logger(): ILogger;
    get debugObjectLogger(): import("../utils/debug-object-logger").DebugObjectLogger;
    get jobDampener(): JobDampener<ConcreteRegistry>;
    init(): void;
    acceptConcreteRegistry(registry: ConcreteRegistry): void;
    private _processConcreteRegistry;
    private _jobDampenerStateMonitorCb;
    private _onDbConnect;
    private _persistLatestJobProcessorState;
}
//# sourceMappingURL=registry.d.ts.map