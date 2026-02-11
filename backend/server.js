const express = require('express');
const cors = require('cors');
const path = require('path');
const { dbAll, dbGet, dbRun } = require('./database');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from frontend build
app.use(express.static(path.join(__dirname, 'public')));

// GET all todos
app.get('/api/todos', async (req, res) => {
  try {
    const todos = await dbAll('SELECT * FROM todos ORDER BY created_at DESC');
    res.json(todos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single todo by ID
app.get('/api/todos/:id', async (req, res) => {
  try {
    const todo = await dbGet('SELECT * FROM todos WHERE id = ?', [req.params.id]);
    if (!todo) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    res.json(todo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create new todo
app.post('/api/todos', async (req, res) => {
  try {
    const { title, description } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const result = await dbRun(
      'INSERT INTO todos (title, description) VALUES (?, ?)',
      [title, description || '']
    );

    const newTodo = await dbGet('SELECT * FROM todos WHERE id = ?', [result.id]);
    res.status(201).json(newTodo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update todo
app.put('/api/todos/:id', async (req, res) => {
  try {
    const { title, description, completed } = req.body;
    const { id } = req.params;

    const existingTodo = await dbGet('SELECT * FROM todos WHERE id = ?', [id]);
    if (!existingTodo) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    await dbRun(
      `UPDATE todos 
       SET title = ?, description = ?, completed = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [
        title !== undefined ? title : existingTodo.title,
        description !== undefined ? description : existingTodo.description,
        completed !== undefined ? (completed ? 1 : 0) : existingTodo.completed,
        id
      ]
    );

    const updatedTodo = await dbGet('SELECT * FROM todos WHERE id = ?', [id]);
    res.json(updatedTodo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE todo
app.delete('/api/todos/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const existingTodo = await dbGet('SELECT * FROM todos WHERE id = ?', [id]);
    if (!existingTodo) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    await dbRun('DELETE FROM todos WHERE id = ?', [id]);
    res.json({ message: 'Todo deleted successfully', id: parseInt(id) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve index.html for any non-API requests (SPA routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`API endpoints available at http://localhost:${PORT}/api/todos`);
});
