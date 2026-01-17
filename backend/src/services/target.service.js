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

module.exports = {
  getAll,
  create,
  increment,
};
