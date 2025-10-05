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

// Fecha conexão com Mongo após todos os testes
after(async () => {
  await mongoose.connection.close()
})