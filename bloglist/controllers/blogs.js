const blogsRouter = require('express').Router()
const Blog = require('../models/blog')
const User = require('../models/user')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')

// Função para pegar token do header Authorization
const getTokenFrom = request => {
  const authorization = request.get('authorization')
  if (authorization && authorization.toLowerCase().startsWith('bearer ')) {
    return authorization.substring(7)
  }
  return null
}

// Listar todos os blogs
blogsRouter.get('/', async (req, res) => {
  const blogs = await Blog.find({}).populate('user', { username: 1, name: 1 })
  res.json(blogs)
})

// Criar um blog (usuário autenticado) usando middleware tokenExtractor
blogsRouter.post('/', async (req, res) => {
  const body = req.body

  // token agora vem do middleware
  const token = req.token

  // Verifica se há token
  if (!token) {
    return res.status(401).json({ error: 'token missing' })
  }

  // Decodifica o token
  let decodedToken
  try {
    decodedToken = jwt.verify(token, process.env.SECRET)
  } catch (error) {
    return res.status(401).json({ error: 'token invalid' })
  }

  if (!decodedToken.id) {
    return res.status(401).json({ error: 'token invalid' })
  }

  // Pega o usuário do banco
  const user = await User.findById(decodedToken.id)
  if (!user) {
    return res.status(400).json({ error: 'user not found' })
  }

  // Cria o blog
  const blog = new Blog({
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes || 0,
    user: user._id
  })

  const savedBlog = await blog.save()

  // Adiciona o blog no usuário
  user.blogs = user.blogs.concat(savedBlog._id)
  await user.save()

  const populatedBlog = await savedBlog.populate('user', { username: 1, name: 1 })
  res.status(201).json(populatedBlog)
})

// Remover um blog (somente criador)
blogsRouter.delete('/:id', async (req, res) => {
  const id = req.params.id

  // Verifica se o ID é válido
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'invalid id' })
  }

  const token = req.token

  // Verifica se há token
  if (!token) {
    return res.status(401).json({ error: 'token missing' })
  }

  // Decodifica o token
  let decodedToken
  try {
    decodedToken = jwt.verify(token, process.env.SECRET)
  } catch (error) {
    return res.status(401).json({ error: 'token invalid' })
  }

  if (!decodedToken.id) {
    return res.status(401).json({ error: 'token invalid' })
  }

  const blog = await Blog.findById(id)

  if (!blog) {
    return res.status(404).json({ error: 'blog not found' })
  }

  // Só o usuário que criou o blog pode deletar
  if (blog.user.toString() !== decodedToken.id.toString()) {
    return res.status(403).json({ error: 'only the creator can delete the blog' })
  }

  await Blog.findByIdAndDelete(id)
  res.status(204).end()
})

// Atualizar um blog
blogsRouter.put('/:id', async (req, res) => {
  const id = req.params.id
  const body = req.body

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'invalid id' })
  }

  const updatedBlog = await Blog.findByIdAndUpdate(
    id,
    { likes: body.likes },
    { new: true, runValidators: true, context: 'query' }
  )

  res.json(updatedBlog)
})

module.exports = blogsRouter