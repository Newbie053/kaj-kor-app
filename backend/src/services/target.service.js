// backend/src/services/target.service.js
const { Target } = require('../models');

// ---------------- GET ALL ----------------
const getAll = async (req, res) => {
  try {
    const targets = await Target.findAll({
      where: { userId: req.userId },
    });

    res.json({ success: true, result: targets });
  } catch (error) {
    console.error('Target getAll error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------- CREATE ----------------
const create = async (req, res) => {
  try {
    const target = await Target.create({
      ...req.body,
      userId: req.userId,
    });

    res.status(201).json({ success: true, result: target });
  } catch (error) {
    console.error('Target create error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------- INCREMENT ----------------
const increment = async (req, res) => {
  try {
    const target = await Target.findOne({
      where: { id: req.params.id, userId: req.userId },
    });

    if (!target)
      return res.status(404).json({ success: false, message: 'Target not found' });

    if (target.completed < target.total) target.completed += 1;
    await target.save();

    res.json({ success: true, result: target });
  } catch (error) {
    console.error('Target increment error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------- MARK DAY COMPLETE ----------------
const markDayComplete = async (req, res) => {
  try {
    const target = await Target.findOne({
      where: { id: req.params.id, userId: req.userId },
    });

    if (!target)
      return res.status(404).json({ success: false, message: 'Target not found' });

    const { notes, timeSpent } = req.body;
    const currentDay = target.currentDay;

    // Update daily logs
    const updatedLogs = [...(target.dailyLogs || []), {
      day: currentDay,
      date: new Date(),
      completed: true,
      notes: notes || '',
      timeSpent: timeSpent || target.dailyMinutes
    }];

    // Update streak (check if completed yesterday)
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let newStreak = target.streak;
    if (!target.lastCompleted ||
        target.lastCompleted.toDateString() === yesterday.toDateString()) {
      newStreak += 1;
    } else {
      newStreak = 1; // reset streak
    }

    // Update target
    await target.update({
      dailyLogs: updatedLogs,
      currentDay: currentDay + 1,
      streak: newStreak,
      lastCompleted: today,
      completed: Math.min(target.completed + 1, target.totalDays || target.total)
    });

    res.json({ success: true, result: target });
  } catch (error) {
    console.error('Mark day complete error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------- SKIP DAY ----------------
const skipDay = async (req, res) => {
  try {
    const target = await Target.findOne({
      where: { id: req.params.id, userId: req.userId },
    });

    if (!target)
      return res.status(404).json({ success: false, message: 'Target not found' });

    // Add skipped day to logs
    const updatedLogs = [...(target.dailyLogs || []), {
      day: target.currentDay,
      date: new Date(),
      completed: false,
      notes: 'Skipped',
      timeSpent: 0
    }];

    // Reset streak
    await target.update({
      dailyLogs: updatedLogs,
      currentDay: target.currentDay + 1,
      streak: 0
    });

    res.json({ success: true, result: target });
  } catch (error) {
    console.error('Skip day error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------- ADD MILESTONE ----------------
const addMilestone = async (req, res) => {
  try {
    const target = await Target.findOne({
      where: { id: req.params.id, userId: req.userId },
    });

    if (!target)
      return res.status(404).json({ success: false, message: 'Target not found' }); // FIXED: Changed ) to }

    const { day, title } = req.body;
    const updatedMilestones = [...(target.milestones || []), { day, title }];

    await target.update({
      milestones: updatedMilestones
    });

    res.json({ success: true, result: target });
  } catch (error) {
    console.error('Add milestone error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
const update = async (req, res) => {
  try {
    const target = await Target.findOne({
      where: { id: req.params.id, userId: req.userId },
    });

    if (!target)
      return res.status(404).json({ success: false, message: 'Target not found' });

    await target.update(req.body);
    res.json({ success: true, result: target });
  } catch (error) {
    console.error('Target update error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------- GET TODAY'S TARGETS ----------------
const getTodayTargets = async (req, res) => {
  try {
    const targets = await Target.findAll({
      where: { userId: req.userId },
    });

    const today = new Date().toISOString().split('T')[0];

    // Process each target to check if today is completed
    const processedTargets = targets.map(target => {
      const dailyLogs = target.dailyLogs || [];
      const todayLog = dailyLogs.find(log => {
        if (!log.date) return false;
        const logDate = new Date(log.date).toISOString().split('T')[0];
        return logDate === today;
      });

      return {
        ...target.toJSON(),
        isCompletedToday: todayLog?.completed || false,
        todayLog: todayLog || null
      };
    });

    res.json({ success: true, result: processedTargets });
  } catch (error) {
    console.error('Get today targets error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
// ---------------- CHECK IF CAN START NEXT DAY ----------------
const canStartNextDay = async (req, res) => {
  try {
    const target = await Target.findOne({
      where: { id: req.params.id, userId: req.userId },
    });

    if (!target)
      return res.status(404).json({ success: false, message: 'Target not found' });

    const today = new Date().toISOString().split('T')[0];
    const dailyLogs = target.dailyLogs || [];

    // Check if today's task is completed
    const todayLog = dailyLogs.find(log => {
      if (!log.date) return false;
      const logDate = new Date(log.date).toISOString().split('T')[0];
      return logDate === today;
    });

    const canStartNext = todayLog?.completed === true;

    res.json({
      success: true,
      result: {
        canStartNext,
        currentDay: target.currentDay,
        todayCompleted: todayLog?.completed || false
      }
    });
  } catch (error) {
    console.error('Can start next day error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------- MANUALLY START NEXT DAY ----------------
const startNextDayManually = async (req, res) => {
  try {
    const target = await Target.findOne({
      where: { id: req.params.id, userId: req.userId },
    });

    if (!target)
      return res.status(404).json({ success: false, message: 'Target not found' });

    const today = new Date().toISOString().split('T')[0];
    const dailyLogs = target.dailyLogs || [];

    // Check if today's task is completed
    const todayLog = dailyLogs.find(log => {
      if (!log.date) return false;
      const logDate = new Date(log.date).toISOString().split('T')[0];
      return logDate === today;
    });

    if (!todayLog || !todayLog.completed) {
      return res.status(400).json({
        success: false,
        message: 'Complete today\'s task first before starting tomorrow\'s task'
      });
    }

    // Increment currentDay ONLY (not completed count)
    await target.update({
      currentDay: target.currentDay + 1
    });

    res.json({
      success: true,
      result: target,
      message: 'Tomorrow\'s task is now available. Good luck!'
    });
  } catch (error) {
    console.error('Start next day manually error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAll,
  create,
  increment,
  markDayComplete,
  skipDay,
  addMilestone,

  update,
  getTodayTargets,
    canStartNextDay,        // Add this
  startNextDayManually,    // Add this

};
