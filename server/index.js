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

// Custom login endpoint: returns user and all descendants by email/password
server.post('/auth/login', (req, res) => {
    const db = router.db;
    const { email, password } = req.body;

    const users = db.get('users').value();

    const findUserRecursively = (nodeList, email, password) => {
        for (const node of nodeList) {
            if (node.email === email && node.password === password) {
                return node;
            }
            if (node.children) {
                const found = findUserRecursively(node.children, email, password);
                if (found) return found;
            }
        }
        return null;
    };

    const findDescendants = (node) => {
        const result = { ...node };
        if (node.children) {
            result.children = node.children.map(child => {
                const fullChild = users.find(u => u.id === child.id);
                return findDescendants(fullChild || child);
            });
        }
        return result;
    };

    const user = findUserRecursively(users, email, password);

    if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }

    const userWithChildren = findDescendants(user);
    res.json(userWithChildren);
});

server.use(router)

const port = process.env.PORT || 3001
server.listen(port, () => {
    console.log(`🚀 JSON Server is running on port ${port}`)
})
