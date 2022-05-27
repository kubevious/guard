import { ILogger } from 'the-logger';
import { Promise } from 'the-promise';
import { Context } from '../../context';
import { DBSnapshotProcessableData, SnapshotReaderTarget } from './types';
import { DeltaSummary } from '../summary/types';
export declare class SnapshotReader {
    private _logger;
    private _context;
    private _target;
    private _dataStore;
    private _partId;
    private _snapshotId;
    constructor(logger: ILogger, context: Context, target: SnapshotReaderTarget);
    queryProcessableData(): Promise<DBSnapshotProcessableData | null>;
    querySnapshotRow(): Promise<Partial<import("@kubevious/data-models").SnapshotsRow> | null>;
    querySnapshotSummary(): Promise<DeltaSummary | null>;
    private _querySnapshotItems;
    private _queryDiffItems;
}
//# sourceMappingURL=snapshot-reader.d.ts.map