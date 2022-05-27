/// <reference types="node" />
import { DBSnapshotItemKey } from './types';
import { SnapItemsRow } from '@kubevious/data-models/dist/models/snapshots';
export declare class DBSnapshot {
    private _snapshotId;
    private _partitionId;
    private _date;
    private _items;
    constructor(snapshotId: Buffer | null, date: string | Date);
    get partitionId(): number | null;
    get snapshotId(): Buffer | null;
    get date(): Date;
    get count(): number;
    get keys(): string[];
    addItemByKey(key: string, item: Partial<SnapItemsRow>): void;
    addItem(item: Partial<SnapItemsRow>): void;
    addItems(items: Partial<SnapItemsRow>[]): void;
    deleteItem(item: Partial<DBSnapshotItemKey>): void;
    delteById(id: string): void;
    getItems(): Partial<SnapItemsRow>[];
    getDict(): Record<string, Partial<SnapItemsRow>>;
    findById(id: string): Partial<SnapItemsRow> | null;
    findItem(item: DBSnapshotItemKey): Partial<SnapItemsRow> | null;
    cloneItemsFrom(other: DBSnapshot): void;
    export(): any;
}
export declare function makeKey(item: Partial<DBSnapshotItemKey>): string;
//# sourceMappingURL=snapshot.d.ts.map