const router = require('express').Router();
const c = require('../controllers/roomController');

router.get('/', c.list);
router.post('/', c.create);
router.get('/:roomCode', c.get);
router.put('/:roomCode', c.replace);
router.patch('/:roomCode', c.update);
router.delete('/:roomCode', c.remove);

module.exports = router;
