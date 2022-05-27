/// <reference types="node" />
import { Server } from '@kubevious/helper-backend';
import { Context } from '../context';
export interface Helpers {
}
export declare class WebServer {
    private logger;
    private server;
    private helpers;
    constructor(context: Context);
    get httpServer(): import("http").Server;
    run(): Promise<Server<Context, Helpers>>;
}
//# sourceMappingURL=index.d.ts.map