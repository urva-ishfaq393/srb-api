const asyncHandler = require('../middleware/asyncHandler');
const roomService = require('../services/roomService');

exports.list = asyncHandler(async (req, res) => {
  res.status(200).json({ data: await roomService.listRooms() });
});
exports.get = asyncHandler(async (req, res) => {
  res.status(200).json(await roomService.getRoom(req.params.roomCode));
});
exports.create = asyncHandler(async (req, res) => {
  res.status(201).json(await roomService.createRoom(req.body));
});
exports.replace = asyncHandler(async (req, res) => {
  res.status(200).json(await roomService.replaceRoom(req.params.roomCode, req.body));
});
exports.update = asyncHandler(async (req, res) => {
  res.status(200).json(await roomService.updateRoom(req.params.roomCode, req.body));
});
exports.remove = asyncHandler(async (req, res) => {
  await roomService.deleteRoom(req.params.roomCode);
  res.status(204).end();
});
