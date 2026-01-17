// backend/src/controllers/progress.controller.js
const router = require('express').Router();
const auth = require('../middleware/auth');
const progressService = require('../services/progress.service');

// Get user progress
router.get('/', auth, progressService.getProgress);

module.exports = router;
