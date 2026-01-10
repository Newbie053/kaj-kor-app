// backend/src/middlewares/auth.js
const jwt = require("jsonwebtoken")
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret"

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization
  if (!authHeader) return res.status(401).json({ message: "No token" })

  const token = authHeader.split(" ")[1]

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.userId = decoded.userId
    next()
  } catch {
    res.status(401).json({ message: "Invalid token" })
  }
}
