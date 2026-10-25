const asyncHandler = require('../middleware/asyncHandler');
const slotService = require('../services/slotService');

exports.create = asyncHandler(async (req, res) => {
  res.status(201).json(await slotService.createSlot(req.body));
});
exports.get = asyncHandler(async (req, res) => {
  res.status(200).json(await slotService.getSlot(req.params.id));
});
exports.list = asyncHandler(async (req, res) => {
  res.status(200).json(await slotService.listSlots(req.query));
});
