const progressService = require('../services/progress.service');
const asyncHandler = require('../utils/asyncHandler');

module.exports = (app) => {
  app.get('/progress', asyncHandler(async (req, res) => {
    const progress = await progressService.getProgress();
    res.json(progress);
  }));
};
