const blogsRouter = require('express').Router()
const Blog = require('../models/blog')
const User = require('../models/user')
const mongoose = require('mongoose')

// Listar todos os blogs
blogsRouter.get('/', async (req, res) => {
  const blogs = await Blog.find({}).populate('user', { username: 1, name: 1 })
  res.json(blogs)
})

// Criar um blog
blogsRouter.post('/', async (req, res) => {
  const body = req.body

  // Checagem de title e url
  if (!body.title || !body.url) {
    return res.status(400).json({ error: 'title or url missing' })
  }

  // Pega um usuário do banco para ser o criador do blog
  const users = await User.find({})
  if (users.length === 0) {
    return res.status(400).json({ error: 'No users found in DB' })
  }
  const user = users[0] // por enquanto, só pega o primeiro usuário

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