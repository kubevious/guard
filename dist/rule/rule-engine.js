"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RuleEngine = void 0;
var the_promise_1 = require("the-promise");
var helper_rule_engine_1 = require("@kubevious/helper-rule-engine");
var RuleEngine = /** @class */ (function () {
    function RuleEngine(context) {
        this._context = context;
        this._logger = context.logger.sublogger("RuleProcessor");
        this._dataStore = context.dataStore.dataStore;
    }
    Object.defineProperty(RuleEngine.prototype, "logger", {
        get: function () {
            return this._logger;
        },
        enumerable: false,
        configurable: true
    });
    RuleEngine.prototype.execute = function (state, rules, tracker) {
        var _this = this;
        this._logger.info("[execute] date: %s, count: %s", state.date.toISOString(), state.getCount());
        return the_promise_1.Promise.resolve()
            .then(function () {
            var processor = new helper_rule_engine_1.RulesProcessor(_this._logger, rules);
            return processor.execute(state, tracker);
        })
            .then(function (executionContext) {
            _this.logger.info('[execute] END');
            return executionContext;
        });
    };
    return RuleEngine;
}());
exports.RuleEngine = RuleEngine;
//# sourceMappingURL=rule-engine.js.map