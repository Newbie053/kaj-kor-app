const bcrypt = require("bcryptjs")

const jwt = require("jsonwebtoken")
const { User } = require("../models")

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret"

exports.signup = async ({ name, email, password }) => {
  const existing = await User.findOne({ where: { email } })
  if (existing) throw new Error("Email already exists")

  const hashedPassword = await bcrypt.hash(password, 10)

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
  })

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
    expiresIn: "7d",
  })

  return { user, token }
}

exports.login = async ({ email, password }) => {
  const user = await User.findOne({ where: { email } })
  if (!user) throw new Error("Invalid credentials")

  const match = await bcrypt.compare(password, user.password)
  if (!match) throw new Error("Invalid credentials")

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
    expiresIn: "7d",
  })

  return { user, token }
}
