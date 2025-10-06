const jwt = require('jsonwebtoken')
const User = require('../models/user')

const userExtractor = async (request, response, next) => {
  const token = request.token // token já vem do middleware tokenExtractor

  if (!token) {
    return response.status(401).json({ error: 'token missing' })
  }

  let decodedToken
  try {
    decodedToken = jwt.verify(token, process.env.SECRET)
  } catch (error) {
    return response.status(401).json({ error: 'token invalid' })
  }

  if (!decodedToken.id) {
    return response.status(401).json({ error: 'token invalid' })
  }

  // Busca o usuário no banco e adiciona ao request
  const user = await User.findById(decodedToken.id)
  if (!user) {
    return response.status(400).json({ error: 'user not found' })
  }

  request.user = user
  next()
}

module.exports = userExtractor