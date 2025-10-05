const { test, beforeEach, after } = require('node:test')
const assert = require('node:assert')
const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const Blog = require('../models/blog')

const api = supertest(app)

const initialBlogs = [
  {
    title: 'First Blog',
    author: 'Alex',
    url: 'http://example.com/first',
    likes: 5,
  },
  {
    title: 'Second Blog',
    author: 'Matiello',
    url: 'http://example.com/second',
    likes: 10,
  },
]

beforeEach(async () => {
  await Blog.deleteMany({})
  await Blog.insertMany(initialBlogs)
})

// Testes principais
test('blogs are returned as json', async () => {
  await api
    .get('/api/blogs')
    .expect(200)
    .expect('Content-Type', /application\/json/)
})

test('all blogs are returned', async () => {
  const response = await api.get('/api/blogs')
  assert.strictEqual(response.body.length, initialBlogs.length)
})

beforeEach(async () => {
  // setup para os testes adicionais
  await Blog.deleteMany({})

  const blogsForAdditionalTests = [
    {
      title: 'First blog',
      author: 'Alex',
      url: 'http://example.com/1',
      likes: 5
    },
    {
      title: 'Second blog',
      author: 'Matiello',
      url: 'http://example.com/2',
      likes: 8
    }
  ]

  await Blog.insertMany(blogsForAdditionalTests)
})

test('blogs are returned as json and have id field', async () => {
  const response = await api
    .get('/api/blogs')
    .expect(200)
    .expect('Content-Type', /application\/json/)

  const blogs = response.body
  assert.ok(blogs[0].id, 'blog should have an id field')
  assert.strictEqual(blogs[0]._id, undefined, 'blog should not have _id field')
})

test('a valid blog can be added via POST', async () => {
  // Conteúdo do novo blog
  const newBlog = {
    title: 'New Blog Post',
    author: 'Test Author',
    url: 'http://example.com/new',
    likes: 7
  }

  // Faz o POST
  await api
    .post('/api/blogs')
    .send(newBlog)
    .expect(201) // ou 201 dependendo do seu backend
    .expect('Content-Type', /application\/json/)

  // Verifica se o número de blogs aumentou
  const response = await api.get('/api/blogs')
  assert.strictEqual(response.body.length, initialBlogs.length + 1)

  // Verifica se o novo blog está na lista
  const titles = response.body.map(blog => blog.title)
  assert.ok(titles.includes('New Blog Post'))
})

test('if likes property is missing, it defaults to 0', async () => {
  const newBlog = {
    title: 'Blog Without Likes',
    author: 'No Likes Author',
    url: 'http://example.com/nolikes'
    // likes está ausente
  }

  // POST para criar o blog
  const response = await api
    .post('/api/blogs')
    .send(newBlog)
    .expect(201)
    .expect('Content-Type', /application\/json/)

  // Verifica se likes foi definido como 0
  assert.strictEqual(response.body.likes, 0)
})

// Fecha conexão com Mongo após todos os testes
after(async () => {
  await mongoose.connection.close()
})