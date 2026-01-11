// backend/src/controllers/progress.controller.js
const progressService = require('../services/progress.service');
const asyncHandler = require('../utils/asyncHandler');
const auth = require('../middleware/auth');

module.exports = (app) => {
  app.get(
    '/progress',
    auth,
    asyncHandler(async (req, res) => {
      const progress = await progressService.getProgress(req.userId);
      res.json(progress);
    })
  );
};
