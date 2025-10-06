const { test, beforeEach, after } = require('node:test')
const assert = require('node:assert')
const mongoose = require('mongoose')
const supertest = require('supertest')
const bcrypt = require('bcrypt')
const app = require('../app')
const api = supertest(app)
const User = require('../models/user')

// Antes de cada teste, limpar DB e criar usuário inicial
beforeEach(async () => {
  await User.deleteMany({})

  const passwordHash = await bcrypt.hash('secret', 10)
  const user = new User({ username: 'root', passwordHash })
  await user.save()
})

// Teste 1: criar usuário válido
test('creation succeeds with a fresh username', async () => {
  const usersAtStart = await User.find({})

  const newUser = {
    username: 'alexandre',
    name: 'Alexandre Matiello',
    password: 'strongpass'
  }

  const response = await api
    .post('/api/users')
    .send(newUser)
    .expect(201)
    .expect('Content-Type', /application\/json/)

  const usersAtEnd = await User.find({})
  assert.strictEqual(usersAtEnd.length, usersAtStart.length + 1)

  const usernames = usersAtEnd.map(u => u.username)
  assert.ok(usernames.includes(newUser.username))
})

// Teste 2: username duplicado
test('creation fails with proper statuscode and message if username already taken', async () => {
  const newUser = {
    username: 'root',
    name: 'Superuser',
    password: 'secret'
  }

  const result = await api
    .post('/api/users')
    .send(newUser)
    .expect(400)
    .expect('Content-Type', /application\/json/)

  assert.ok(result.body.error.includes('username must be unique'))
})

// Teste 3: username ou password muito curto
test('creation fails if username or password are too short', async () => {
  const newUser = {
    username: 'al',
    name: 'Shorty',
    password: 'pw'
  }

  const result = await api
    .post('/api/users')
    .send(newUser)
    .expect(400)

  assert.ok(result.body.error.includes('at least 3 characters long'))
})

// Teste 4: username ou password ausente
test('creation fails if username or password are missing', async () => {
  const newUser = { name: 'Missing fields' }

  const result = await api
    .post('/api/users')
    .send(newUser)
    .expect(400)

  assert.ok(result.body.error.includes('required'))
})

// Fecha conexão com Mongo após todos os testes
after(async () => {
  await mongoose.connection.close()
})