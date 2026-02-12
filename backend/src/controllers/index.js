// backend/src/controllers/index.js
const router = require('express').Router();

router.use(require('./task.controller'));
router.use(require('./target.controller'));
router.use(require('./user.controller'));
router.use(require('./feedback.controller'));
router.use('/progress', require('./progress.controller'));

module.exports = router;
