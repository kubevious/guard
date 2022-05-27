"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProcessorBuilder = exports.Processor = void 0;
function Processor() {
    return new ProcessorBuilder();
}
exports.Processor = Processor;
var ProcessorBuilder = /** @class */ (function () {
    function ProcessorBuilder() {
        this._data = { order: 0, isDisabled: false };
    }
    ProcessorBuilder.prototype.disable = function () {
        this._data.isDisabled = true;
        return this;
    };
    ProcessorBuilder.prototype.order = function (value) {
        this._data.order = value;
        return this;
    };
    ProcessorBuilder.prototype.handler = function (value) {
        this._data.handler = value;
        return this;
    };
    ProcessorBuilder.prototype._export = function () {
        return this._data;
    };
    return ProcessorBuilder;
}());
exports.ProcessorBuilder = ProcessorBuilder;
//# sourceMappingURL=builder.js.map