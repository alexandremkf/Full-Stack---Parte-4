const blogsRouter = require('express').Router()
const Blog = require('../models/blog')
const User = require('../models/user')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const userExtractor = require('../middleware/userExtractor')

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

// Criar um blog (usuário autenticado) usando userExtractor
blogsRouter.post('/', userExtractor, async (req, res) => {
  const body = req.body
  const user = req.user // usuário já vem do middleware

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

// Remover um blog (somente criador) usando userExtractor
blogsRouter.delete('/:id', userExtractor, async (req, res) => {
  const id = req.params.id
  const user = req.user // usuário já vem do middleware

  // Verifica se o ID é válido
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'invalid id' })
  }

  const blog = await Blog.findById(id)

  if (!blog) {
    return res.status(404).json({ error: 'blog not found' })
  }

  // Só o usuário que criou o blog pode deletar
  if (blog.user.toString() !== user._id.toString()) {
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