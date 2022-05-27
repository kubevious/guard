"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var joi_1 = __importDefault(require("joi"));
function default_1(router, context, logger) {
    router.url('/api/v1/collect');
    router.post('/snapshot', function (req, res) {
        var data = req.body;
        var date = new Date(data.date);
        var parserVersion = data.version;
        var baseSnapshotId = data.snapshot_id;
        logger.info("New snapshot reporting started. Date %s. ParserVersion: %s.", date.toISOString(), parserVersion);
        return context.collector.newSnapshot(date, parserVersion, baseSnapshotId);
    })
        .bodySchema(joi_1.default.object({
        date: joi_1.default.string().isoDate().required(),
        version: joi_1.default.string().optional(),
        snapshot_id: joi_1.default.string().optional(),
    }));
    router.post('/snapshot/items', function (req, res) {
        var data = req.body;
        return context.collector.acceptSnapshotItems(data.snapshot_id, data.items);
    })
        .bodySchema(joi_1.default.object({
        snapshot_id: joi_1.default.string().required(),
        items: joi_1.default.array().required().items(joi_1.default.object())
    }));
    router.post('/snapshot/activate', function (req, res) {
        return context.collector.activateSnapshot(req.body.snapshot_id);
    })
        .bodySchema(joi_1.default.object({
        snapshot_id: joi_1.default.string().required(),
        items: joi_1.default.array().items(joi_1.default.object({
            idHash: joi_1.default.string().required(),
            present: joi_1.default.boolean().required(),
            configHash: joi_1.default.string().optional(),
        }))
    }));
    router.post('/config', function (req, res) {
        var data = req.body;
        return context.collector.storeConfig(data.hash, data.config);
    })
        .bodySchema(joi_1.default.object({
        hash: joi_1.default.string().required(),
        config: joi_1.default.object().required()
    }));
}
exports.default = default_1;
//# sourceMappingURL=collector.js.map