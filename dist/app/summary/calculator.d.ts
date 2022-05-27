import { ILogger } from 'the-logger';
import { PersistableSnapshot } from '../executor/persistable-snapshot';
import { AlertsSummary, DeltaSummary, TimelineSummary } from './types';
export declare class SummaryCalculator {
    private _logger;
    private _targetSnapshot;
    private _deltaSnapshot;
    private _prevSummary;
    private _alertsSummary;
    private _timelineSummary;
    constructor(logger: ILogger, targetSnapshot: PersistableSnapshot, deltaSnapshot: PersistableSnapshot, prevSummary: DeltaSummary);
    get alertsSummary(): AlertsSummary;
    get timelineSummary(): TimelineSummary;
    process(): DeltaSummary;
    private _constructSnapshotSummary;
    private _constructAlertsSummary;
    private _calculateCurrentSnapshotAlerts;
    private _calculateDeltaSnapshotAlerts;
    private _calculateTimelineSummary;
    private _appendAlertCounts;
    private _subtractAlertCounts;
}
//# sourceMappingURL=calculator.d.ts.map