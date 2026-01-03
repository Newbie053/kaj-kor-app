
// backend/src/controllers/target.controller.js
const targetService = require('../services/target.service');
const asyncHandler = require('../utils/asyncHandler');

module.exports = (app) => {
  app.get('/targets', asyncHandler(async (req, res) => {
    const targets = await targetService.getAll();
    res.json(targets);
  }));

  app.post('/targets', asyncHandler(async (req, res) => {
    const target = await targetService.create(req.body);
    res.status(201).json(target);
  }));

  app.patch('/targets/:id/increment', asyncHandler(async (req, res) => {
    const target = await targetService.increment(req.params.id);
    res.json(target);
  }));
};
