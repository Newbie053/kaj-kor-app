const { Task } = require('../models');

// ---------------- GET ALL ----------------
const getAll = async (req, res) => {
  try {
    const tasks = await Task.findAll({
      where: { userId: req.userId },
    });

    res.json({ success: true, result: tasks });
  } catch (error) {
    console.error('Task getAll error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------- CREATE ----------------
const create = async (req, res) => {
  try {
    const task = await Task.create({
      ...req.body,
      userId: req.userId,
    });

    res.status(201).json({ success: true, result: task });
  } catch (error) {
    console.error('Task create error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------- UPDATE ----------------
const update = async (req, res) => {
  try {
    const task = await Task.findOne({
      where: { id: req.params.id, userId: req.userId },
    });

    if (!task)
      return res.status(404).json({ success: false, message: 'Task not found' });

    await task.update(req.body);
    res.json({ success: true, result: task });
  } catch (error) {
    console.error('Task update error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------- TOGGLE ----------------
const toggle = async (req, res) => {
  try {
    const task = await Task.findOne({
      where: { id: req.params.id, userId: req.userId },
    });

    if (!task)
      return res.status(404).json({ success: false, message: 'Task not found' });

    task.isCompleted = !task.isCompleted;
    await task.save();

    res.json({ success: true, result: task });
  } catch (error) {
    console.error('Task toggle error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------- DELETE ----------------
const remove = async (req, res) => {
  try {
    const task = await Task.findOne({
      where: { id: req.params.id, userId: req.userId },
    });

    if (!task)
      return res.status(404).json({ success: false, message: 'Task not found' });

    await task.destroy();
    res.status(204).send();
  } catch (error) {
    console.error('Task delete error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAll,
  create,
  update,
  toggle,
  remove,
};
