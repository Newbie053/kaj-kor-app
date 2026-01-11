const { Target } = require('../models');

exports.getAll = async (userId) => {
  return await Target.findAll({
    where: { userId }
  });
};

exports.create = async (data, userId) => {
  return await Target.create({
    ...data,
    userId
  });
};

exports.increment = async (id, userId) => {
  const target = await Target.findOne({
    where: { id, userId }
  });

  if (!target) throw new Error("Target not found");

  if (target.completed < target.total) {
    target.completed += 1;
  }

  await target.save();
  return target;
};
