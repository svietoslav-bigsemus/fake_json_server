// index.js
const jsonServer = require('json-server');
const path = require('path');

const server = jsonServer.create();
const router = jsonServer.router(path.join(__dirname, '../db.json'));
const middlewares = jsonServer.defaults();

server.use(middlewares);
server.use(jsonServer.bodyParser);

// Custom logout endpoint (мнимый)
server.post('/auth/logout', (req, res) => {
    res.status(200).json({ message: 'Logged out successfully' })
});

// Custom login endpoint: returns user and all descendants by email/password
server.post('/auth/login', (req, res) => {
    const db = router.db;
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    const users = db.get('users').value();

    const findUserRecursively = (userList, email, password) => {
        for (const user of userList) {
            if (user.email === email && user.password === password) {
                return user;
            }
            if (user.children && Array.isArray(user.children)) {
                const found = findUserRecursively(user.children, email, password);
                if (found) return found;
            }
        }
        return null;
    };

    const findDescendants = (node) => {
        const result = { ...node };
        delete result.password;

        if (node.children && Array.isArray(node.children)) {
            result.children = node.children.map(child => findDescendants(child));
        }

        return result;
    };

    const user = findUserRecursively(users, email, password);

    if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }

    const userWithChildren = findDescendants(user);
    console.log(`✅ User ${email} logged in`);
    res.json(userWithChildren);
});

// Custom GET endpoint to return user by ID with all nested children
server.get('/user-tree/:id', (req, res) => {
    const db = router.db;
    const users = db.get('users').value();
    const { id } = req.params;

    const findUserRecursively = (list, targetId) => {
        for (const user of list) {
            if (user.id === targetId) return user;
            if (user.children && Array.isArray(user.children)) {
                const found = findUserRecursively(user.children, targetId);
                if (found) return found;
            }
        }
        return null;
    };

    const findDescendants = (node) => {
        const result = { ...node };
        delete result.password;

        if (node.children && Array.isArray(node.children)) {
            result.children = node.children.map(child => {
                const fullChild = findUserRecursively(users, child.id);
                return fullChild ? findDescendants(fullChild) : child;
            });
        }

        return result;
    };

    const user = findUserRecursively(users, id);
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    const userWithChildren = findDescendants(user);
    res.json(userWithChildren);
});

server.use(router);

const port = process.env.PORT || 3001
server.listen(port, () => {
    console.log(`🚀 JSON Server is running on port ${port}`)
});
