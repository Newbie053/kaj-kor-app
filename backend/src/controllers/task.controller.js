const { Task } = require('../models')
const asyncHandler = require('../utils/asyncHandler')
const auth = require("../middleware/auth")

module.exports = (app) => {

  // GET all tasks for logged-in user
  app.get("/tasks", auth, asyncHandler(async (req, res) => {
    const tasks = await Task.findAll({
      where: { userId: req.userId }
    })
    res.json(tasks)
  }))

  // CREATE task for logged-in user
  app.post("/tasks", auth, asyncHandler(async (req, res) => {
    const task = await Task.create({
      ...req.body,
      userId: req.userId
    })
    res.status(201).json(task)
  }))

  // UPDATE task (ownership enforced)
  app.put("/tasks/:id", auth, asyncHandler(async (req, res) => {
    const task = await Task.findOne({
      where: { id: req.params.id, userId: req.userId }
    })
    if (!task) return res.status(404).json({ message: "Task not found" })

    await task.update(req.body)
    res.json(task)
  }))

  // TOGGLE task (ownership enforced)
  app.patch("/tasks/:id/toggle", auth, asyncHandler(async (req, res) => {
    const task = await Task.findOne({
      where: { id: req.params.id, userId: req.userId }
    })
    if (!task) return res.status(404).json({ message: "Task not found" })

    task.isCompleted = !task.isCompleted
    await task.save()
    res.json(task)
  }))

  // DELETE task (ownership enforced)
  app.delete("/tasks/:id", auth, asyncHandler(async (req, res) => {
    const task = await Task.findOne({
      where: { id: req.params.id, userId: req.userId }
    })
    if (!task) return res.status(404).json({ message: "Task not found" })

    await task.destroy()
    res.status(204).send()
  }))
}
