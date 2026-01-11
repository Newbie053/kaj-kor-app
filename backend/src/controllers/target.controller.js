// backend/src/controllers/target.controller.js
const targetService = require('../services/target.service');
const asyncHandler = require('../utils/asyncHandler');
const auth = require("../middleware/auth");

module.exports = (app) => {

  // GET targets for logged-in user
  app.get('/targets', auth, asyncHandler(async (req, res) => {
    const targets = await targetService.getAll(req.userId);
    res.json(targets);
  }));

  // CREATE target for logged-in user
  app.post('/targets', auth, asyncHandler(async (req, res) => {
    const target = await targetService.create(req.body, req.userId);
    res.status(201).json(target);
  }));

  // INCREMENT progress (ownership enforced)
  app.patch('/targets/:id/increment', auth, asyncHandler(async (req, res) => {
    const target = await targetService.increment(req.params.id, req.userId);
    res.json(target);
  }));
};
