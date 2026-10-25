const mongoose = require('mongoose');

const HOURS = [8, 10, 12, 14, 16];

const slotSchema = new mongoose.Schema(
  {
    roomCode: { type: String, required: [true, 'roomCode is required'], uppercase: true, trim: true },
    date: {
      type: String, // YYYY-MM-DD
      required: [true, 'date is required'],
      validate: {
        validator: (v) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(`${v}T00:00:00Z`)),
        message: 'date must be a valid YYYY-MM-DD date',
      },
    },
    startHour: {
      type: Number,
      required: [true, 'startHour is required'],
      enum: { values: HOURS, message: 'startHour must be one of 8, 10, 12, 14, 16' },
    },
    seats: { type: Number, required: true, min: 1 }, // copied from the room
    booked: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true, versionKey: false }
);

slotSchema.index({ roomCode: 1, date: 1, startHour: 1 }, { unique: true });

module.exports = mongoose.model('Slot', slotSchema);
module.exports.HOURS = HOURS;
