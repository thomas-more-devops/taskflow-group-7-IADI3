const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Task = require('./models/Task');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
mongoose.connect(`mongodb://${process.env.DB_HOST}:27017/${process.env.DB_NAME}`)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB error:', err));

app.use(cors());
app.use(express.json());

// Wrap async route handlers so a rejected promise reaches the error
// handler below instead of hanging the request / crashing the process.
// Express only does this automatically from v5; we're on 4.x.
const wrap = (fn) => (req, res, next) => fn(req, res, next).catch(next);

// Health check (under /api so nginx's "location /api" proxy can reach it;
// a bare "/health" would be swallowed by the frontend's static-file route)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'backend' });
});

// Task routes
app.get('/api/tasks', wrap(async (req, res) => {
  const tasks = await Task.find();
  res.json(tasks);
}));

app.post('/api/tasks', wrap(async (req, res) => {
  const task = new Task(req.body);
  await task.save();
  res.status(201).json(task);
}));

app.delete('/api/tasks/:id', wrap(async (req, res) => {
  await Task.findByIdAndDelete(req.params.id);
  res.status(204).send();
}));

// Not in the original spec, but required: the frontend's edit/toggle
// actions call PUT /api/tasks/:id (see public/scripts/app.js). Dropping
// this route silently breaks "complete" and "edit" in the UI.
app.put('/api/tasks/:id', wrap(async (req, res) => {
  const { _id, id, ...updates } = req.body; // never update the id itself
  const task = await Task.findByIdAndUpdate(req.params.id, updates, { new: true });
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json(task);
}));

// Error handler: has to come after the routes
app.use((err, req, res, next) => {
  console.error(err.message);
  const status = ['CastError', 'ValidationError'].includes(err.name) ? 400 : 500;
  res.status(status).json({ error: err.message });
});

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
