const crypto = require('crypto');
const { Server } = require('socket.io');
const config = require('../config/env');
const events = require('../services/events');
const roomService = require('../services/roomService');
const slotService = require('../services/slotService');

const roomChannel = (roomCode) => `room:${roomCode}`;

function sameKey(given, expected) {
  if (typeof given !== 'string' || typeof expected !== 'string' || !expected) return false;
  const a = crypto.createHash('sha256').update(given).digest();
  const b = crypto.createHash('sha256').update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

function initSockets(httpServer) {
  const io = new Server(httpServer);

  // ---- Public namespace "/" : boards ----
  io.on('connection', (socket) => {
    socket.on('join:room', async (roomCode, ack) => {
      const reply = typeof ack === 'function' ? ack : () => {};
      try {
        if (typeof roomCode !== 'string' || !roomCode.trim()) {
          return reply({ ok: false, error: { status: 400, message: 'roomCode is required' } });
        }
        const room = await roomService.getRoom(roomCode);

        // A board watches one room at a time
        [...socket.rooms].filter((r) => r.startsWith('room:')).forEach((r) => socket.leave(r));
        await socket.join(roomChannel(room.roomCode));

        const slots = await slotService.listSlotsForRoom(room.roomCode);
        return reply({
          ok: true,
          room: { roomCode: room.roomCode, name: room.name, building: room.building, seats: room.seats },
          slots: slots.map((s) => ({
            slotId: String(s._id),
            date: s.date,
            startHour: s.startHour,
            seats: s.seats,
            seatsLeft: s.seatsLeft,
          })),
        });
      } catch (err) {
        return reply({ ok: false, error: { status: err.status || 500, message: err.message } });
      }
    });
  });

  // REST or GraphQL booking/cancel -> notify ONLY the sockets of that room
  events.on('slot:updated', ({ roomCode, slotId, seatsLeft }) => {
    io.to(roomChannel(roomCode)).emit('slot:updated', { slotId, seatsLeft });
  });

  // ---- /admin namespace: needs adminKey ----
  const admin = io.of('/admin');

  admin.use((socket, next) => {
    const key = socket.handshake.auth && socket.handshake.auth.adminKey;
    if (!sameKey(key, config.adminKey)) {
      const err = new Error('Invalid or missing admin key');
      err.data = { status: 401, code: 'ADMIN_KEY_INVALID' };
      return next(err);
    }
    return next();
  });

  admin.on('connection', (socket) => {
    socket.on('announce', (payload, ack) => {
      const reply = typeof ack === 'function' ? ack : () => {};
      const message = typeof payload === 'string' ? payload : payload && payload.message;
      if (typeof message !== 'string' || !message.trim() || message.length > 300) {
        return reply({ ok: false, error: 'message must be a text of 1 to 300 characters' });
      }
      // Every connected board (default namespace) shows it
      io.emit('announcement', { message: message.trim(), sentAt: new Date().toISOString() });
      return reply({ ok: true });
    });
  });

  return io;
}

module.exports = initSockets;
