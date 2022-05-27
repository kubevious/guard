import { ILogger } from 'the-logger';
import { Promise } from 'the-promise';
import { Context } from '../../context';
import { DBSnapshotProcessableData } from './types';
export declare class RecentBaseSnapshotReader {
    private _logger;
    private _context;
    constructor(logger: ILogger, context: Context);
    query(): Promise<DBSnapshotProcessableData | null>;
    private _queryLatestSnapshot;
}
//# sourceMappingURL=recent-base-snapshot-reader.d.ts.map