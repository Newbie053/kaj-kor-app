// backend/src/controllers/target.controller.js
const router = require('express').Router();
const auth = require('../middleware/auth');
const targetService = require('../services/target.service');

router.get('/targets', auth, targetService.getAll);
router.post('/targets', auth, targetService.create);
router.patch('/targets/:id/increment', auth, targetService.increment);

// =========== ADD THESE NEW ROUTES ===========
router.patch('/targets/:id/complete-day', auth, targetService.markDayComplete);
router.patch('/targets/:id/skip-day', auth, targetService.skipDay);
router.post('/targets/:id/milestones', auth, targetService.addMilestone);
// backend/src/controllers/target.controller.js - Add this route:
router.patch('/targets/:id', auth, targetService.update); // Add this line
module.exports = router;
