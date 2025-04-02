// index.js
const jsonServer = require('json-server')
const path = require('path')

const server = jsonServer.create()
const router = jsonServer.router(path.join(__dirname, '../db.json'))
const middlewares = jsonServer.defaults()

server.use(middlewares)

// Custom logout endpoint (мнимый)
server.post('/auth/logout', (req, res) => {
    res.status(200).json({ message: 'Logged out successfully' })
})

server.use(router)

const port = process.env.PORT || 3001
server.listen(port, () => {
    console.log(`🚀 JSON Server is running on port ${port}`)
})
