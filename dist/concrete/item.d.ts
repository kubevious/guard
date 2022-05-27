import { ILogger, DumpWriter } from 'the-logger';
import { ConcreteRegistry } from './registry';
import { ItemId, IConcreteItem } from '@kubevious/helper-logic-processor';
export declare class ConcreteItem implements IConcreteItem {
    private _registry;
    private _id;
    private _config;
    private _groupKey;
    constructor(registry: ConcreteRegistry, id: ItemId, config: any);
    get logger(): ILogger;
    get registry(): ConcreteRegistry;
    get id(): ItemId;
    get groupKey(): string;
    get config(): any;
    matchesFilter(idFilter?: Record<string, any>): boolean;
    debugOutputToFile(writer: DumpWriter): void;
    dump(): Record<any, any>;
}
//# sourceMappingURL=item.d.ts.map