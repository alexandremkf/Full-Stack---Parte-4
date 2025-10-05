const blogsRouter = require('express').Router()
const Blog = require('../models/blog')
const mongoose = require('mongoose')

// Listar todos os blogs
blogsRouter.get('/', async (req, res) => {
  const blogs = await Blog.find({})
  res.json(blogs)
})

// Criar um blog
blogsRouter.post('/', async (req, res) => {
  const body = req.body

  // Checagem de title e url
  if (!body.title || !body.url) {
    return res.status(400).json({ error: 'title or url missing' })
  }

  const blog = new Blog({
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes
  })

  const savedBlog = await blog.save()
  res.status(201).json(savedBlog)
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