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

module.exports = {
  getAll,
  create,
  increment,
  markDayComplete,
  skipDay,
  addMilestone,

  update,

};
