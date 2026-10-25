const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Slot = require('../models/Slot');
const Room = require('../models/Room');
const AppError = require('../utils/AppError');
const { isObjectId } = require('../utils/ids');
const studentService = require('./studentService');
const events = require('./events');

// Booking + slot + room joined, so callers get room name, date and start hour.
async function describeBookings(match) {
  return Booking.aggregate([
    { $match: match },
    { $lookup: { from: Slot.collection.name, localField: 'slot', foreignField: '_id', as: 'slotDoc' } },
    { $unwind: '$slotDoc' },
    { $lookup: { from: Room.collection.name, localField: 'slotDoc.roomCode', foreignField: 'roomCode', as: 'roomDoc' } },
    { $unwind: '$roomDoc' },
    {
      $project: {
        _id: 0,
        bookingId: '$_id',
        slotId: '$slotDoc._id',
        roomCode: '$slotDoc.roomCode',
        roomName: '$roomDoc.name',
        building: '$roomDoc.building',
        date: '$slotDoc.date',
        startHour: '$slotDoc.startHour',
        bookedAt: '$createdAt',
      },
    },
    { $sort: { date: 1, startHour: 1 } },
  ]);
}

function notifySlot(slot) {
  events.emit('slot:updated', {
    roomCode: slot.roomCode,
    slotId: String(slot._id),
    seatsLeft: slot.seats - slot.booked,
  });
}

async function listBookings(regNo) {
  const student = await studentService.getStudent(regNo); // 404 if missing
  return describeBookings({ regNo: student.regNo });
}

async function createBooking(regNo, slotId) {
  if (slotId === undefined || slotId === null || slotId === '') throw new AppError(400, 'slotId is required');
  if (!isObjectId(slotId)) throw new AppError(400, 'slotId is not a valid id');

  const student = await studentService.getStudent(regNo); // 404
  const slot = await Slot.findById(slotId).lean();
  if (!slot) throw new AppError(404, 'Slot not found');

  if (await Booking.exists({ regNo: student.regNo, slot: slot._id })) {
    throw new AppError(409, 'Student has already booked this slot', 'ALREADY_BOOKED');
  }

  // Take the seat in ONE atomic step: only succeeds while booked < seats,
  // so two students can never get the last seat.
  const updated = await Slot.findOneAndUpdate(
    { _id: slot._id, $expr: { $lt: ['$booked', '$seats'] } },
    { $inc: { booked: 1 } },
    { new: true }
  );
  if (!updated) throw new AppError(409, 'No free seat left in this slot', 'SLOT_FULL');

  let booking;
  try {
    booking = await Booking.create({ regNo: student.regNo, slot: slot._id });
  } catch (err) {
    // Give the seat back if the booking row could not be saved
    await Slot.updateOne({ _id: slot._id, booked: { $gt: 0 } }, { $inc: { booked: -1 } });
    if (err.code === 11000) throw new AppError(409, 'Student has already booked this slot', 'ALREADY_BOOKED');
    throw err;
  }

  notifySlot(updated);
  const [details] = await describeBookings({ _id: booking._id });
  return details;
}

async function cancelBooking(regNo, slotId) {
  if (!isObjectId(slotId)) throw new AppError(400, 'slotId is not a valid id');
  const student = await studentService.getStudent(regNo); // 404

  const removed = await Booking.findOneAndDelete({
    regNo: student.regNo,
    slot: new mongoose.Types.ObjectId(slotId),
  });
  if (!removed) throw new AppError(404, 'Booking not found');

  const slot = await Slot.findOneAndUpdate(
    { _id: removed.slot, booked: { $gt: 0 } },
    { $inc: { booked: -1 } },
    { new: true }
  );
  if (slot) notifySlot(slot);
  return slot || (await Slot.findById(removed.slot));
}

module.exports = { createBooking, cancelBooking, listBookings };
