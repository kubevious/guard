import { DBSnapshot } from "./snapshot";


export interface DBSnapshotRow {
    base_snapshot_id: Buffer | null,
    date: string,
    summary: any
}

export interface DBSnapshotItemKey {
    dn: string,
    kind: string,
    config_kind: string,
    name?: string,
}

export interface DBSnapshotFullData
{
    snapshot: DBSnapshot,
    summary: any
}

export interface DBSnapshotProcessableData
{
    baseSnapshot?: DBSnapshot,
    snapshot: DBSnapshot,
    summary: any
}


export interface SnapshotReaderTarget {
    snapshotId: Buffer,
}
