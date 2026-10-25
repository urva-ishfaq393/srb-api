const router = require('express').Router();
const c = require('../controllers/slotController');

router.get('/', c.list);
router.post('/', c.create);
router.get('/:id', c.get);

module.exports = router;
