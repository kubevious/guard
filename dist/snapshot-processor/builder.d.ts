import { ILogger } from "the-logger";
import { Context } from "../context";
import { ProcessingTrackerScoper } from "@kubevious/helper-backend";
import { RegistryState } from "@kubevious/state-registry";
import { ExecutionContext as RuleEngineExecutionContext, RuleObject } from '@kubevious/helper-rule-engine';
export declare function Processor(): ProcessorBuilder;
export interface HandlerArgs {
    logger: ILogger;
    state: RegistryState;
    tracker: ProcessingTrackerScoper;
    context: Context;
    rules: RuleObject[];
    ruleEngineResult: RuleEngineExecutionContext;
}
export declare type Handler = (args: HandlerArgs) => any;
export interface ProcessorInfo {
    order: number;
    isDisabled: boolean;
    handler?: Handler;
}
export declare class ProcessorBuilder {
    private _data;
    disable(): this;
    order(value: number): this;
    handler(value: Handler): this;
    _export(): ProcessorInfo;
}
//# sourceMappingURL=builder.d.ts.map