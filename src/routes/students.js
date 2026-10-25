const router = require('express').Router();
const c = require('../controllers/studentController');

router.post('/', c.create);
router.get('/:regNo', c.get);
router.post('/:regNo/bookings', c.createBooking);
router.get('/:regNo/bookings', c.listBookings);
router.delete('/:regNo/bookings/:slotId', c.cancelBooking);

module.exports = router;
