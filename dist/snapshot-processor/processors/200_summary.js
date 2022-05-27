"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var the_lodash_1 = __importDefault(require("the-lodash"));
var state_registry_1 = require("@kubevious/state-registry");
var builder_1 = require("../builder");
var entity_meta_1 = require("@kubevious/entity-meta");
exports.default = (0, builder_1.Processor)()
    .order(200)
    .handler(function (_a) {
    var logger = _a.logger, state = _a.state, tracker = _a.tracker, context = _a.context;
    state.addNewItem({
        dn: 'summary',
        kind: 'summary',
        config_kind: state_registry_1.SnapshotConfigKind.node,
        config: {
            kind: entity_meta_1.NodeKind.summary,
            rn: 'summary',
            name: 'summary'
        }
    });
    state.addNewItem({
        dn: 'summary',
        kind: 'summary',
        config_kind: state_registry_1.SnapshotConfigKind.props,
        config: {
            kind: entity_meta_1.PropsKind.counters,
            id: entity_meta_1.PropsId.appCounters,
            title: 'Configuration Summary',
            order: 10,
            config: [{
                    title: 'Namespaces',
                    value: state.countScopeByKind('root/logic', entity_meta_1.NodeKind.ns)
                }, {
                    title: 'Applications',
                    value: state.countScopeByKind('root/logic', entity_meta_1.NodeKind.app)
                }, {
                    title: 'Pods',
                    value: state.countScopeByKind('root/logic', entity_meta_1.NodeKind.pod)
                }]
        }
    });
    state.addNewItem({
        dn: 'summary',
        kind: 'summary',
        config_kind: state_registry_1.SnapshotConfigKind.props,
        config: {
            kind: entity_meta_1.PropsKind.counters,
            id: entity_meta_1.PropsId.infraCounters,
            title: 'Infrastructure Summary',
            order: 11,
            config: [{
                    title: 'Nodes',
                    value: state.countScopeByKind('root/infra/nodes', entity_meta_1.NodeKind.node)
                },
                getVolumeCount(),
                getClusterCPU(),
                getClusterRAM(),
                getClusterStorage()
            ]
        }
    });
    state.addNewItem({
        dn: 'summary',
        kind: 'summary',
        config_kind: state_registry_1.SnapshotConfigKind.props,
        config: {
            kind: entity_meta_1.PropsKind.objectList,
            id: entity_meta_1.PropsId.topIssueNamespaces,
            title: 'Top Namespaces with Issues',
            order: 12,
            config: getTopNamespacesWithIssues()
        }
    });
    state.addNewItem({
        dn: 'summary',
        kind: 'summary',
        config_kind: state_registry_1.SnapshotConfigKind.props,
        config: {
            kind: entity_meta_1.PropsKind.alertTargetList,
            id: entity_meta_1.PropsId.topIssues,
            title: 'Top Issues',
            order: 13,
            config: getTopIssues()
        }
    });
    /***********/
    function getTopNamespacesWithIssues() {
        var namespaces = state.scopeByKind('root/logic', entity_meta_1.NodeKind.ns);
        var namespaceInfos = [];
        for (var _i = 0, _a = the_lodash_1.default.values(namespaces); _i < _a.length; _i++) {
            var ns = _a[_i];
            var counters = {
                totalIssues: 0,
                alertCount: {
                    error: 0,
                    warn: 0
                }
            };
            extractNamespaceAlerts(ns, counters);
            counters.totalIssues = counters.alertCount.error * 2 + counters.alertCount.warn;
            namespaceInfos.push({
                dn: ns.dn,
                counters: counters
            });
        }
        var orderedNamespaces = the_lodash_1.default.orderBy(namespaceInfos, function (x) { return x.counters.totalIssues; }, 'desc');
        var topNamespaces = the_lodash_1.default.take(orderedNamespaces, 3);
        return topNamespaces.map(function (x) {
            return {
                dn: x.dn,
                alertCount: x.counters.alertCount
            };
        });
    }
    function getTopIssues() {
        var alertDict = {};
        for (var _i = 0, _a = state.scopeFlat('root'); _i < _a.length; _i++) {
            var node = _a[_i];
            var alerts = state.getAlerts(node.dn);
            for (var _b = 0, alerts_1 = alerts; _b < alerts_1.length; _b++) {
                var alert_1 = alerts_1[_b];
                var alertKey = getAlertKey(alert_1);
                if (!alertDict[alertKey]) {
                    alertDict[alertKey] = {
                        alert: alert_1,
                        targets: []
                    };
                }
                alertDict[alertKey].targets.push(node.dn);
            }
        }
        var orderedAlerts = the_lodash_1.default.orderBy(the_lodash_1.default.values(alertDict), function (x) { return x.targets.length; }, 'desc');
        var topAlerts = the_lodash_1.default.take(orderedAlerts, 3);
        return topAlerts;
    }
    function extractNamespaceAlerts(node, counters) {
        for (var _i = 0, _a = node.selfAlerts; _i < _a.length; _i++) {
            var alert_2 = _a[_i];
            counters.alertCount[alert_2.severity] += 1;
        }
        for (var _b = 0, _c = state.getChildrenDns(node.dn); _b < _c.length; _b++) {
            var childDn = _c[_b];
            var childNode = state.getNode(childDn);
            extractNamespaceAlerts(childNode, counters);
        }
    }
    function getAlertKey(alert) {
        return [alert.severity, alert.msg, the_lodash_1.default.stableStringify(alert.source)].join('-');
    }
    function getClusterCPU() {
        var value = getInfraCapacity('cpu allocatable');
        if (!value) {
            value = {
                value: 0,
                unit: 'cores'
            };
        }
        return {
            title: 'Cluster CPU',
            value: value.value,
            unit: value.unit
        };
    }
    function getClusterRAM() {
        var value = getInfraCapacity('memory allocatable');
        if (!value) {
            value = {
                value: 0,
                unit: 'bytes'
            };
        }
        return {
            title: 'Cluster RAM',
            value: value.value,
            unit: value.unit
        };
    }
    function getVolumeCount() {
        var value = getStorageCapacity('Volume Count');
        if (!value) {
            value = 0;
        }
        return {
            title: 'Volumes',
            value: value
        };
    }
    function getClusterStorage() {
        var value = getStorageCapacity('Capacity');
        if (!value) {
            value = {
                value: 0,
                unit: 'bytes'
            };
        }
        return {
            title: 'Cluster Storage',
            value: value.value,
            unit: value.unit
        };
    }
    function getInfraCapacity(key) {
        var item = state.findByDn('root/infra/nodes');
        if (!item) {
            return '?';
        }
        var config = item.getProperties('cluster-resources');
        if (!config) {
            return '?';
        }
        var value = config.config[key];
        return value;
    }
    function getStorageCapacity(key) {
        var item = state.findByDn('root/infra/storage');
        if (!item) {
            return 0;
        }
        var config = item.getProperties('properties');
        if (!config) {
            return 0;
        }
        var value = config.config[key];
        return value;
    }
});
//# sourceMappingURL=200_summary.js.map