import { AlertCounter } from "@kubevious/state-registry";
export interface DeltaSummary {
    snapshot: SnapshotSummary;
    delta: SnapshotSummary;
}
export interface SnapshotSummary {
    items: number;
    kinds: Record<string, number>;
    alerts: AlertCounter;
    alertsByKind: Record<string, AlertCounter>;
}
export declare type AlertsSummary = Record<string, Record<string, AlertCounter>>;
export declare function newAlertsCounter(): AlertCounter;
export declare function newSnapshotSummary(): SnapshotSummary;
export declare function newDeltaSummary(): DeltaSummary;
export interface TimelineSummary {
    changes: number;
    error: number;
    warn: number;
}
//# sourceMappingURL=types.d.ts.map