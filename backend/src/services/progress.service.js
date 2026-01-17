// backend/src/services/progress.service.js
const { Target } = require('../models');

// ------------------- GET PROGRESS -------------------
const getProgress = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized user',
      });
    }

    const progress = await Target.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
    });

    return res.json({
      success: true,
      result: progress,
    });
  } catch (error) {
    console.error('Error in getProgress:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch progress',
      errorMessage: error.message,
    });
  }
};

module.exports = {
  getProgress,
};
