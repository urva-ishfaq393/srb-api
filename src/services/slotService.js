const Slot = require('../models/Slot');
const Room = require('../models/Room');
const AppError = require('../utils/AppError');
const { isObjectId } = require('../utils/ids');

const withSeatsLeft = (slot) => {
  const o = typeof slot.toObject === 'function' ? slot.toObject() : slot;
  return { ...o, seatsLeft: o.seats - o.booked };
};

async function createSlot(body) {
  const { roomCode, date, startHour } = body || {};
  if (typeof roomCode !== 'string' || !roomCode.trim()) throw new AppError(400, 'roomCode is required');
  const room = await Room.findOne({ roomCode: roomCode.trim().toUpperCase() });
  if (!room) throw new AppError(404, `Room ${roomCode} not found`);
  const slot = await Slot.create({ roomCode: room.roomCode, date, startHour, seats: room.seats });
  return withSeatsLeft(slot);
}

async function getSlot(id) {
  if (!isObjectId(id)) throw new AppError(400, 'Invalid slot id');
  const slot = await Slot.findById(id).lean();
  if (!slot) throw new AppError(404, 'Slot not found');
  return withSeatsLeft(slot);
}

function toPositiveInt(value, name, fallback) {
  if (value === undefined) return fallback;
  if (!/^\d+$/.test(String(value)) || Number(value) < 1) {
    throw new AppError(400, `${name} must be a positive whole number`);
  }
  return Number(value);
}

// Filters: roomCode, date, hasSeats=true ; paging: page, limit
async function listSlots(query = {}) {
  const page = toPositiveInt(query.page, 'page', 1);
  const limit = Math.min(toPositiveInt(query.limit, 'limit', 10), 100);
  const filter = {};

  if (query.roomCode !== undefined) filter.roomCode = String(query.roomCode).toUpperCase();
  if (query.date !== undefined) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(query.date))) throw new AppError(400, 'date must be YYYY-MM-DD');
    filter.date = String(query.date);
  }
  if (query.hasSeats !== undefined) {
    if (!['true', 'false'].includes(String(query.hasSeats))) throw new AppError(400, 'hasSeats must be true or false');
    if (query.hasSeats === 'true') filter.$expr = { $lt: ['$booked', '$seats'] };
  }

  const [rows, total] = await Promise.all([
    Slot.find(filter).sort({ date: 1, startHour: 1 }).skip((page - 1) * limit).limit(limit).lean(),
    Slot.countDocuments(filter),
  ]);

  return { data: rows.map(withSeatsLeft), page, limit, total, totalPages: Math.ceil(total / limit) };
}

// Used by the socket board: every slot of one room, no paging
async function listSlotsForRoom(roomCode) {
  const rows = await Slot.find({ roomCode }).sort({ date: 1, startHour: 1 }).lean();
  return rows.map(withSeatsLeft);
}

module.exports = { createSlot, getSlot, listSlots, listSlotsForRoom, withSeatsLeft };
