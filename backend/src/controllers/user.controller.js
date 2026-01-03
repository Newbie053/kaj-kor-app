const userService = require('../services/user.service');
const asyncHandler = require('../utils/asyncHandler');

module.exports = (app) => {
  app.get('/users', asyncHandler(async (req, res) => {
    const users = await userService.getAll();
    res.json(users);
  }));

  app.post('/users', asyncHandler(async (req, res) => {
    const user = await userService.create(req.body);
    res.status(201).json(user);
  }));
};
