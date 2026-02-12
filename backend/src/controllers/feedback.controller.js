const router = require('express').Router();
const auth = require('../middleware/auth');
const feedbackService = require('../services/feedback.service');

router.post('/feedback', auth, feedbackService.create);

module.exports = router;
