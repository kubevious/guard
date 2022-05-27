/// <reference types="bluebird" />
import { ILogger } from 'the-logger';
import { Context } from '../context';
import { RegistryState } from '@kubevious/state-registry';
import { ProcessingTrackerScoper } from '@kubevious/helper-backend';
import { RuleObject } from '@kubevious/helper-rule-engine';
export declare class RuleEngine {
    private _logger;
    private _context;
    private _dataStore;
    constructor(context: Context);
    get logger(): ILogger;
    execute(state: RegistryState, rules: RuleObject[], tracker: ProcessingTrackerScoper): import("bluebird")<import("@kubevious/helper-rule-engine").ExecutionContext>;
}
//# sourceMappingURL=rule-engine.d.ts.map