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

test('blog without title is not added', async () => {
  const newBlog = {
    author: 'No Title Author',
    url: 'http://example.com/notitle',
    likes: 5
  }

  await api
    .post('/api/blogs')
    .send(newBlog)
    .expect(400)

  // Garantir que o número de blogs não aumentou
  const response = await api.get('/api/blogs')
  assert.strictEqual(response.body.length, initialBlogs.length)
})

test('blog without url is not added', async () => {
  const newBlog = {
    title: 'No URL Blog',
    author: 'No URL Author',
    likes: 5
  }

  await api
    .post('/api/blogs')
    .send(newBlog)
    .expect(400)

  // Garantir que o número de blogs não aumentou
  const response = await api.get('/api/blogs')
  assert.strictEqual(response.body.length, initialBlogs.length)
})

test('deletion of a blog succeeds with status code 204 if id is valid', async () => {
  const blogsAtStart = await api.get('/api/blogs').then(res => res.body)
  const blogToDelete = blogsAtStart[0]

  await api.delete(`/api/blogs/${blogToDelete.id}`).expect(204)

  const blogsAtEnd = await api.get('/api/blogs').then(res => res.body)
  const titles = blogsAtEnd.map(b => b.title)

  assert.strictEqual(blogsAtEnd.length, blogsAtStart.length - 1)
  assert.ok(!titles.includes(blogToDelete.title))
})

test('deletion fails with status code 400 if id is invalid', async () => {
  const invalidId = '5a3d5da59070081a82a3445'
  await api.delete(`/api/blogs/${invalidId}`).expect(400)
})

test('updating likes of a blog succeeds with valid id', async () => {
  const blogsAtStart = await api.get('/api/blogs').then(res => res.body)
  const blogToUpdate = blogsAtStart[0]

  const updatedData = { likes: blogToUpdate.likes + 1 }

  const result = await api
    .put(`/api/blogs/${blogToUpdate.id}`)
    .send(updatedData)
    .expect(200)
    .expect('Content-Type', /application\/json/)

  assert.strictEqual(result.body.likes, blogToUpdate.likes + 1)
})

test('updating a blog fails with status code 400 if id is invalid', async () => {
  const invalidId = '5a3d5da59070081a82a3445'
  const updatedData = { likes: 10 }

  await api.put(`/api/blogs/${invalidId}`).send(updatedData).expect(400)
})

// Fecha conexão com Mongo após todos os testes
after(async () => {
  await mongoose.connection.close()
})