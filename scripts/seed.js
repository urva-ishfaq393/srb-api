// Inserts sample data: 4 rooms, 12 slots, 3 students.  Run: npm run seed
// WARNING: it first clears rooms, slots, students and bookings.
const mongoose = require('mongoose');
const config = require('../src/config/env');
const Room = require('../src/models/Room');
const Slot = require('../src/models/Slot');
const Student = require('../src/models/Student');
const Booking = require('../src/models/Booking');

const day = (offset) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().slice(0, 10);
};

const rooms = [
  { roomCode: 'ROOM-01', name: 'Quiet Study Hall', building: 'Library', seats: 6 },
  { roomCode: 'ROOM-02', name: 'Group Discussion Room', building: 'CS Block', seats: 4 },
  { roomCode: 'ROOM-03', name: 'Silent Pod', building: 'Library', seats: 1 }, // 1 seat: used to test SLOT_FULL
  { roomCode: 'ROOM-04', name: 'Project Lab', building: 'Engineering Block', seats: 8 },
];

const plan = [
  ['ROOM-01', day(1), [8, 10, 12, 14, 16]],
  ['ROOM-02', day(1), [8, 10, 12]],
  ['ROOM-03', day(1), [8, 10]],
  ['ROOM-04', day(2), [10, 12]],
];

const students = [
  { regNo: 'FA23-BCS-045', name: 'Ayesha Khan', email: 'ayesha.khan@example.com' },
  { regNo: 'FA23-BAI-051', name: 'Faiza', email: 'faiza@example.com' },
  { regNo: 'FA23-BCS-102', name: 'Hamza Ali', email: 'hamza.ali@example.com' },
];

async function seed() {
  await mongoose.connect(config.mongoUrl);
  await Promise.all([Room.deleteMany({}), Slot.deleteMany({}), Student.deleteMany({}), Booking.deleteMany({})]);
  await Promise.all([Room.syncIndexes(), Slot.syncIndexes(), Student.syncIndexes(), Booking.syncIndexes()]);

  const createdRooms = await Room.insertMany(rooms);
  const seatsOf = Object.fromEntries(createdRooms.map((r) => [r.roomCode, r.seats]));

  const slots = plan.flatMap(([roomCode, date, hours]) =>
    hours.map((startHour) => ({ roomCode, date, startHour, seats: seatsOf[roomCode], booked: 0 }))
  );
  await Slot.insertMany(slots);
  await Student.insertMany(students);

  console.log(`Seeded ${createdRooms.length} rooms, ${slots.length} slots, ${students.length} students.`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
