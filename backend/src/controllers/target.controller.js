const router = require('express').Router();
const auth = require('../middleware/auth');
const targetService = require('../services/target.service');

router.get('/targets', auth, targetService.getAll);
router.post('/targets', auth, targetService.create);
router.patch('/targets/:id/increment', auth, targetService.increment);

module.exports = router;
