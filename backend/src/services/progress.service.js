// backend/src/services/progress.service.js
const { Target } = require('../models');

exports.getProgress = async (userId) => {
  return await Target.findAll({
    where: { userId }
  });
};
