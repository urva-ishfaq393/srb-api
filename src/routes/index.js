const router = require('express').Router();

router.use('/rooms', require('./rooms'));
router.use('/slots', require('./slots'));
router.use('/students', require('./students'));

module.exports = router;
