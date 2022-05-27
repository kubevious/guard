import { ILogger } from 'the-logger';
import { RegistryBundleState } from '@kubevious/state-registry';
import { Context } from '../context';
export declare class Registry {
    private _context;
    private _logger;
    private _currentState;
    constructor(context: Context);
    get logger(): ILogger;
    getCurrentState(): RegistryBundleState;
    accept(bundle: RegistryBundleState): void;
}
//# sourceMappingURL=registry.d.ts.map