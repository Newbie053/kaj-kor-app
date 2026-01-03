// backend/src/services/target.service.js
const { Target } = require('../models');

exports.getAll = async () => await Target.findAll();

exports.create = async (data) => await Target.create(data);

exports.increment = async (id) => {
  const target = await Target.findByPk(id);
  if (!target) throw new Error('Target not found');
  if (target.completed < target.total) target.completed += 1;
  await target.save();
  return target;
};
