// backend/src/services/progress.service.js
const { Target } = require('../models');

exports.getProgress = async () => {
  const targets = await Target.findAll();
  return targets;
};
