"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var rule_engine_1 = require("../../rule/rule-engine");
var builder_1 = require("../builder");
exports.default = (0, builder_1.Processor)()
    .order(100)
    .handler(function (_a) {
    var logger = _a.logger, state = _a.state, tracker = _a.tracker, rules = _a.rules, ruleEngineResult = _a.ruleEngineResult, context = _a.context;
    var ruleEngine = new rule_engine_1.RuleEngine(context);
    return ruleEngine.execute(state, rules, tracker)
        .then(function (result) {
        ruleEngineResult.rules = result.rules;
        ruleEngineResult.markers = result.markers;
    });
});
//# sourceMappingURL=100_rules-engine.js.map