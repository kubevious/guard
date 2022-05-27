/// <reference types="node" />
import { BundledNodeConfig } from '@kubevious/state-registry/dist/registry-bundle-state';
import { DBSnapshot } from '../reader/snapshot';
export declare type PersistableConfig = any;
export interface PersistableSnapshotItemsRow {
    dn: string;
    kind: string;
    config_kind: string;
    name?: string;
    config_hash: Buffer;
}
export interface PersistableDiffItemsRow {
    dn: string;
    kind: string;
    config_kind: string;
    name?: string;
    present: boolean;
    config_hash?: Buffer;
}
export declare class PersistableSnapshot {
    private _dbSnapshot;
    private _configs;
    private _nodeConfigs;
    private _isDiffSnapshot;
    private _diffItems;
    constructor(snapshotId: Buffer, date: string | Date);
    get partitionId(): number;
    get snapshotId(): Buffer;
    get date(): Date;
    get snapItemCount(): number;
    get dbSnapshot(): DBSnapshot;
    get configs(): Record<string, ConfigItem>;
    get nodeConfigs(): NodeConfigInfo[];
    get diffKeys(): string[];
    get diffItems(): PersistableDiffItemsRow[];
    get diffItemCount(): number;
    get isDiffSnapshot(): boolean;
    addItem(item: PersistableSnapshotItemsRow): void;
    addDiffItem(item: PersistableDiffItemsRow): void;
    addConfig(config: PersistableConfig): Buffer;
    getConfig(hash: Buffer | string): any | null;
    addNodeConfig(dn: string, config: BundledNodeConfig): void;
    constructDiff(id: Buffer): PersistableSnapshot;
    export(): any;
}
export interface NodeConfigInfo {
    dn: string;
    config: BundledNodeConfig;
}
export interface ConfigItem {
    hash: Buffer;
    hashStr: string;
    config: PersistableConfig;
}
//# sourceMappingURL=persistable-snapshot.d.ts.map