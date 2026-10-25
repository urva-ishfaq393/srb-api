const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    regNo: { type: String, required: true, uppercase: true },
    slot: { type: mongoose.Schema.Types.ObjectId, ref: 'Slot', required: true },
  },
  { timestamps: true, versionKey: false }
);

// A student cannot book the same slot twice (also protects against races).
bookingSchema.index({ regNo: 1, slot: 1 }, { unique: true });

module.exports = mongoose.model('Booking', bookingSchema);
