const express = require('express')
const app = express()
const mongoose = require('mongoose')
const blogsRouter = require('./controllers/blogs')
const config = require('./utils/config')
const usersRouter = require('./controllers/users')

mongoose.connect(config.MONGODB_URI)

app.use(express.json())
app.use('/api/blogs', blogsRouter)
app.use('/api/users', usersRouter)

module.exports = app