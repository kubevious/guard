import { ConcreteRegistry } from "../../concrete/registry";

export interface ExecutorTarget {
    // registry: ConcreteRegistry;
    job: {
        namespace: string,
        name: string,
    }
}

export interface ExecutorTaskTarget {
    job: {
        namespace: string,
        name: string,
    },
    registry: ConcreteRegistry;
    snapshotIdStr: string;
}



export interface ExecutorCounters
{
    processCount: number;
    recentDurations : number[];
}