const blogsRouter = require('express').Router()
const Blog = require('../models/blog')
const User = require('../models/user')
const mongoose = require('mongoose')
const { tokenExtractor, userExtractor } = require('../utils/middleware')

// Listar todos os blogs
blogsRouter.get('/', async (req, res) => {
  const blogs = await Blog.find({}).populate('user', { username: 1, name: 1 })
  res.json(blogs)
})


// Criar um blog (protegido por token)
blogsRouter.post('/', tokenExtractor, userExtractor, async (req, res) => {
  const body = req.body

  // Checagem de title e url
  if (!body.title || !body.url) {
    return res.status(400).json({ error: 'title or url missing' })
  }

  // Usuário autenticado via token
  const user = req.user

  const blog = new Blog({
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes || 0,
    user: user._id
  })

  const savedBlog = await blog.save()

  // Adiciona o blog na lista de blogs do usuário
  user.blogs = user.blogs.concat(savedBlog._id)
  await user.save()

  // Popula o usuário antes de enviar a resposta
  const populatedBlog = await savedBlog.populate('user', { username: 1, name: 1 })
  res.status(201).json(populatedBlog)
})

// Remover um blog
blogsRouter.delete('/:id', async (req, res) => {
  const id = req.params.id

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'invalid id' })
  }

  await Blog.findByIdAndDelete(id)
  res.status(204).end()
})

// Atualizar um blog
blogsRouter.put('/:id', async (req, res) => {
  const id = req.params.id
  const body = req.body

  // validação do ID
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'invalid id' })
  }

  // Atualiza o blog e retorna o novo documento
  const updatedBlog = await Blog.findByIdAndUpdate(
    id,
    { likes: body.likes },
    { new: true, runValidators: true, context: 'query' }
  )

  res.json(updatedBlog)
})

module.exports = blogsRouter