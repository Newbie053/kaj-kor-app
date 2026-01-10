// backend/src/controllers/user.controller.js
const userService = require("../services/user.service");

module.exports = (app) => {
  // Signup
  app.post("/auth/signup", async (req, res) => {
    try {
      const user = await userService.signup(req.body);
      res.status(201).json(user);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  });

  // Login
  app.post("/auth/login", async (req, res) => {
    try {
      const result = await userService.login(req.body);
      res.json(result);
    } catch (err) {
      res.status(401).json({ message: err.message });
    }
  });
};
