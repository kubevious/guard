import { Promise } from 'the-promise';
import { ILogger } from 'the-logger';
import { Context } from '../../context';
export declare class WebSocketUpdater {
    private _logger;
    private _context;
    private _backendClient;
    constructor(context: Context);
    get logger(): ILogger;
    notifyNewSnapshot(): Promise<import("@kubevious/http-client").ClientResponse<any>>;
    notifyReporter(): Promise<import("@kubevious/http-client").ClientResponse<any>>;
    private _notifySocket;
}
export declare enum WebSocketKind {
    node = "node",
    children = "children",
    props = "props",
    alerts = "alerts",
    latest_snapshot_id = "latest_snapshot_id",
    rules_list = "rules-list",
    rules_statuses = "rules-statuses",
    rule_result = "rule-result",
    markers_list = "markers-list",
    markers_statuses = "markers-statuses",
    marker_result = "marker-result",
    cluster_reporting_status = "cluster_reporting_status"
}
//# sourceMappingURL=websocket-updater.d.ts.map