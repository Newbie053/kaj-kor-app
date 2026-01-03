const { User } = require('../models');

exports.getAll = async () => await User.findAll();

exports.create = async (data) => await User.create(data);
