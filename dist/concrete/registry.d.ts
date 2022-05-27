/// <reference types="bluebird" />
import { ILogger } from 'the-logger';
import { ConcreteItem } from './item';
import { ItemId, IConcreteRegistry } from '@kubevious/helper-logic-processor';
export declare class ConcreteRegistry implements IConcreteRegistry {
    private _logger;
    private _snapshotId;
    private _date;
    private _agentVersion;
    private _flatItemsDict;
    private _itemsKindDict;
    constructor(logger: ILogger, snapshotId: string, date: Date, agentVersion: string);
    get logger(): ILogger;
    get snapshotId(): string;
    get date(): Date;
    get agentVersion(): string;
    get allItems(): ConcreteItem[];
    add(id: ItemId, obj: any): void;
    remove(id: ItemId): void;
    findById(id: ItemId): ConcreteItem | null;
    filterItems(idFilter: any): ConcreteItem[];
    private _makeDictId;
    extractCapacity(): {
        name: string;
        count: number;
    }[];
    debugOutputCapacity(): void;
    debugOutputToFile(): import("bluebird")<void>;
    dump(): Record<any, any>;
    debugOutputRegistry(registryName: string): void;
}
//# sourceMappingURL=registry.d.ts.map