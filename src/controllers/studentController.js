const asyncHandler = require('../middleware/asyncHandler');
const studentService = require('../services/studentService');
const bookingService = require('../services/bookingService');

exports.create = asyncHandler(async (req, res) => {
  res.status(201).json(await studentService.createStudent(req.body));
});
exports.get = asyncHandler(async (req, res) => {
  res.status(200).json(await studentService.getStudent(req.params.regNo));
});

exports.createBooking = asyncHandler(async (req, res) => {
  const booking = await bookingService.createBooking(req.params.regNo, (req.body || {}).slotId);
  res.status(201).json(booking);
});
exports.listBookings = asyncHandler(async (req, res) => {
  res.status(200).json({ data: await bookingService.listBookings(req.params.regNo) });
});
exports.cancelBooking = asyncHandler(async (req, res) => {
  await bookingService.cancelBooking(req.params.regNo, req.params.slotId);
  res.status(204).end();
});
