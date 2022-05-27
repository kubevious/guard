"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var the_promise_1 = require("the-promise");
var rules_engine_1 = require("@kubevious/data-models/dist/accessors/rules-engine");
var migration_1 = require("../migration");
exports.default = (0, migration_1.Migrator)()
    .handler(function (_a) {
    var executeSql = _a.executeSql;
    return the_promise_1.Promise.resolve()
        .then(function () { return the_promise_1.Promise.serial(MARKERS, function (x) {
        var sql = "INSERT IGNORE INTO `markers`(`name`, `shape`, `color`, `propagate`) VALUES (?, ?, ?, ?)";
        var params = [
            x.name,
            x.shape,
            x.color,
            false
        ];
        return executeSql(sql, params);
    }); })
        .then(function () { return the_promise_1.Promise.serial(RULES, function (x) {
        x.enabled = true;
        var row = (0, rules_engine_1.makeDbRulesRow)(x);
        var sql = "INSERT IGNORE INTO `rules`(`name`, `enabled`, `date`, `target`, `script`, `hash`) VALUES (?, ?, ?, ?, ?, ?)";
        var params = [
            row.name,
            row.enabled,
            row.date,
            row.target,
            row.script,
            row.hash
        ];
        return executeSql(sql, params);
    }); });
});
var MARKERS = [
    {
        name: 'high-memory-user',
        shape: 'f4e3',
        color: '#FF3E3A'
    },
    {
        name: 'large-namespace',
        shape: 'f447',
        color: '#61E48B'
    },
    {
        name: 'medium-memory-user',
        shape: 'f5ce',
        color: '#FE9F30'
    },
    {
        name: 'public-application',
        shape: 'f57d',
        color: '#14CFFF'
    }
];
var RULES = [
    {
        name: 'container-memory-usage',
        enabled: true,
        target: "select('Container')",
        script: "var value = item.getProperties('resources')['memory request'];\nif (value) {\n    if (unit.memory(value).in('gb') >= 4) {\n        mark('high-memory-user');\n    }\n    else if (unit.memory(value).in('mb') >= 600) {\n        mark('medium-memory-user');\n    }\n} else {\n    warning('Memory request is not set. This is not a good practice. Please correct ASAP.')\n}"
    },
    {
        name: 'image-latest-tag-check',
        enabled: true,
        target: "select('Image')",
        script: "if (item.props.tag == 'latest') {\n    error(\"You are using latest image tag. Please don't do that.\");\n}"
    },
    {
        name: 'large-namespace',
        enabled: true,
        target: "select('Namespace')\n    .filter(({item}) => {\n        const cpu = item.getProperties('cluster-consumption').cpu;\n        const memory = item.getProperties('cluster-consumption').memory;\n        return (unit.percentage(cpu) >= 30) ||\n               (unit.percentage(memory) >= 30);\n    })",
        script: "mark('large-namespace')"
    },
    {
        name: 'no-resource-limits-pods',
        enabled: true,
        target: "select('Namespace')\n    .filter(({item}) => item.name != 'kube-system')\n.descendant ('Pod')",
        script: "for(var container of item.config.spec.containers)\n{\n  if (!container.resources.limits)\n  {\n    warning('No resource limit set');\n  }\n}"
    },
    {
        name: 'public-application',
        enabled: true,
        target: "select('Application')\n    .filter(({item}) => {\n        return item.hasDescendants('Ingress');\n    })",
        script: "mark(\"public-application\")"
    }
];
//# sourceMappingURL=8.js.map