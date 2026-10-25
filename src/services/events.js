// Tiny event bus. Services emit "slot:updated"; the Socket.IO layer listens.
// This way the booking logic does not know anything about sockets, and both
// REST and GraphQL bookings trigger the same real-time update.
const { EventEmitter } = require('events');

module.exports = new EventEmitter();
