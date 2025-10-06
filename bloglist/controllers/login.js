const config = require('../utils/config')
console.log('SECRET:', config.SECRET)
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const loginRouter = require('express').Router()
const User = require('../models/user')

// Rota para login
loginRouter.post('/', async (req, res) => {
  const { username, password } = req.body

  const user = await User.findOne({ username })
  const passwordCorrect = user === null
    ? false
    : await bcrypt.compare(password, user.passwordHash)

  if (!(user && passwordCorrect)) {
    return res.status(401).json({
      error: 'invalid username or password'
    })
  }

  const userForToken = {
    username: user.username,
    id: user._id
  }

  // USAR config.SECRET e não process.env
  const token = jwt.sign(userForToken, config.SECRET, { expiresIn: 60*60 })

  res.status(200).send({ token, username: user.username, name: user.name })
})

module.exports = loginRouter