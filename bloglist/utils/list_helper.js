const dummy = (blogs) => {
  return 1
}

// Retorna o total de likes
const totalLikes = (blogs) => {
  return blogs.reduce((sum, blog) => sum + blog.likes, 0)
}

// Retorna o blog com mais likes
const favoriteBlog = (blogs) => {
  if (blogs.length === 0) return null
  return blogs.reduce((favorite, current) => {
    return current.likes > favorite.likes ? current : favorite
  })
}

// Retorna o autor com mais blogs
const mostBlogs = (blogs) => {
  if (blogs.length === 0) return null

  const counts = {}

  // Contar quantidade de blogs por autor
  blogs.forEach(blog => {
    counts[blog.author] = (counts[blog.author] || 0) + 1
  })

  // Encontrar o autor com mais blogs
  let topAuthor = null
  let maxBlogs = 0

  for (const author in counts) {
    if (counts[author] > maxBlogs) {
      maxBlogs = counts[author]
      topAuthor = author
    }
  }

  return {
    author: topAuthor,
    blogs: maxBlogs
  }
}

// Retorna o autor com mais likes no total
const mostLikes = (blogs) => {
  if (blogs.length === 0) return null

  const likesCount = {}

  // Somar likes de cada autor
  blogs.forEach(blog => {
    likesCount[blog.author] = (likesCount[blog.author] || 0) + blog.likes
  })

  // Encontrar autor com mais likes
  let topAuthor = null
  let maxLikes = 0

  for (const author in likesCount) {
    if (likesCount[author] > maxLikes) {
      maxLikes = likesCount[author]
      topAuthor = author
    }
  }

  return {
    author: topAuthor,
    likes: maxLikes
  }
}

module.exports = {
  dummy,
  totalLikes,
  favoriteBlog,
  mostBlogs,
  mostLikes
}