/// <reference types="bluebird" />
import { ILogger } from 'the-logger';
import { RegistryState, RegistryBundleState } from '@kubevious/state-registry';
import { ExecutionContext as RuleEngineExecutionContext, RuleObject } from '@kubevious/helper-rule-engine';
import { Context } from '../context';
import { ProcessingTrackerScoper } from '@kubevious/helper-backend';
export declare class SnapshotProcessor {
    private _logger;
    private _context;
    private _processors;
    constructor(context: Context);
    get logger(): ILogger;
    private _extractProcessors;
    process(registryState: RegistryState, rules: RuleObject[], tracker: ProcessingTrackerScoper): import("bluebird")<{
        bundle: RegistryBundleState;
        ruleEngineResult: RuleEngineExecutionContext;
    }>;
    private _runProcessors;
}
//# sourceMappingURL=index.d.ts.map