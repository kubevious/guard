/// <reference types="bluebird" />
import { Promise, Resolvable } from 'the-promise';
import { ILogger } from 'the-logger';
import { ReportableSnapshotItem, ResponseReportSnapshot, ResponseReportSnapshotItems } from '@kubevious/agent-middleware';
import { Context } from '../context';
import { BackendMetricItem } from '@kubevious/ui-middleware';
export declare class Collector {
    private _logger;
    private _context;
    private _snapshots;
    private _snapshotsToProcess;
    private _agentVersion?;
    private _currentMetric;
    private _latestMetric;
    private _recentDurations;
    private _reportingDelay;
    private _configHashes;
    private _lastReportDate;
    private _counters;
    constructor(context: Context);
    get logger(): ILogger;
    newSnapshot(date: Date, agentVersion: string, baseSnapshotId?: string): Resolvable<ResponseReportSnapshot>;
    acceptSnapshotItems(snapshotId: string, items: ReportableSnapshotItem[]): {
        new_snapshot: boolean;
    } | import("bluebird")<ResponseReportSnapshotItems>;
    activateSnapshot(snapshotId: string): {
        new_snapshot: boolean;
    } | Promise<{}>;
    storeConfig(hash: string, config: any): void;
    completeSnapshotProcessing(snapshotId: string): void;
    private _extractId;
    private _cleanup;
    private _canAcceptNewSnapshot;
    extractMetrics(): BackendMetricItem[];
    private _newMetric;
    private _endMetric;
}
//# sourceMappingURL=collector.d.ts.map