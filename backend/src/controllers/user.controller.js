// backend/src/controllers/user.controller.js
const router = require('express').Router();
const userService = require('../services/user.service');

router.post('/auth/signup', userService.signup);
router.post('/auth/login', userService.login);

module.exports = router;
