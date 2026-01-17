const router = require('express').Router();
const auth = require('../middleware/auth');
const taskService = require('../services/task.service');

// GET all tasks
router.get('/tasks', auth, taskService.getAll);

// CREATE task
router.post('/tasks', auth, taskService.create);

// UPDATE task
router.put('/tasks/:id', auth, taskService.update);

// TOGGLE task
router.patch('/tasks/:id/toggle', auth, taskService.toggle);

// DELETE task
router.delete('/tasks/:id', auth, taskService.remove);

module.exports = router;
