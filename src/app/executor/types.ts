import { ConcreteRegistry } from "../../concrete/registry";

export interface ExecutorTarget {
    changeId: string,
}

export interface ExecutorTaskTarget {
    changeId: string,
    registry: ConcreteRegistry;
    snapshotIdStr: string;
}



export interface ExecutorCounters
{
    processStartCount: number;
    processCompleteCount: number;
    processFailCount: number;

    recentDurations : number[];
}