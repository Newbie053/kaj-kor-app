const { Task } = require('../models');

exports.getAll = async () => await Task.findAll();

exports.create = async (data) => await Task.create(data);

exports.toggle = async (id) => {
  const task = await Task.findByPk(id);
  if (!task) throw new Error('Task not found');
  task.isCompleted = !task.isCompleted;
  await task.save();
  return task;
};
