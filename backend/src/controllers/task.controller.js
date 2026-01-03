// backend/src/controllers/task.controller.js
const taskService = require('../services/task.service');
const asyncHandler = require('../utils/asyncHandler');

module.exports = (app) => {
  app.get('/tasks', asyncHandler(async (req, res) => {
    const tasks = await taskService.getAll();
    res.json(tasks);
  }));

  app.post('/tasks', asyncHandler(async (req, res) => {
    const task = await taskService.create(req.body);
    res.status(201).json(task);
    console.log('Task created:', task);
  }));
  app.put('/tasks/:id', asyncHandler(async (req, res) => {
  const task = await taskService.update(req.params.id, req.body);
  res.json(task);
}));


  app.patch('/tasks/:id/toggle', asyncHandler(async (req, res) => {
    const task = await taskService.toggle(req.params.id);
    res.json(task);
  }));
  app.delete('/tasks/:id', asyncHandler(async (req, res) => {
  await taskService.remove(req.params.id);
  res.status(204).send();
}));

};
