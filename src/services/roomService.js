const Room = require('../models/Room');
const Slot = require('../models/Slot');
const AppError = require('../utils/AppError');

const normalize = (code) => String(code || '').trim().toUpperCase();
const FIELDS = ['name', 'building', 'seats'];

async function listRooms() {
  return Room.find().sort('roomCode').lean();
}

async function getRoom(roomCode) {
  const room = await Room.findOne({ roomCode: normalize(roomCode) });
  if (!room) throw new AppError(404, `Room ${normalize(roomCode)} not found`);
  return room;
}

async function createRoom(body) {
  const { roomCode, name, building, seats } = body || {};
  return Room.create({ roomCode, name, building, seats });
}

// roomCode can never change after creation -> 422
function assertCodeUnchanged(urlCode, body) {
  if (body && body.roomCode !== undefined && normalize(body.roomCode) !== normalize(urlCode)) {
    throw new AppError(422, 'roomCode cannot be changed after the room is created', 'ROOMCODE_IMMUTABLE');
  }
}

// PUT: replace all editable fields (missing ones fail validation -> 422)
async function replaceRoom(roomCode, body) {
  assertCodeUnchanged(roomCode, body);
  const room = await getRoom(roomCode);
  FIELDS.forEach((f) => { room[f] = body ? body[f] : undefined; });
  return room.save();
}

// PATCH: change only the fields that were sent
async function updateRoom(roomCode, body) {
  assertCodeUnchanged(roomCode, body);
  const changes = FIELDS.filter((f) => body && body[f] !== undefined);
  if (changes.length === 0) throw new AppError(400, 'Send at least one of: name, building, seats');
  const room = await getRoom(roomCode);
  changes.forEach((f) => { room[f] = body[f]; });
  return room.save();
}

async function deleteRoom(roomCode) {
  const room = await getRoom(roomCode);
  if (await Slot.exists({ roomCode: room.roomCode })) {
    throw new AppError(409, 'Room still has slots; remove them first', 'ROOM_HAS_SLOTS');
  }
  await room.deleteOne();
}

module.exports = { listRooms, getRoom, createRoom, replaceRoom, updateRoom, deleteRoom };
