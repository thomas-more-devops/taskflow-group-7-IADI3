const express = require('express');
const cors = require('cors');
const connectDB = require('./database');
const Task = require('./models/Task');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to database
connectDB();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const wrap = (fn) => (req, res, next) => fn(req, res, next).catch(next);

// Bonus: health check endpoint (useful for Docker HEALTHCHECK / orchestrators)
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// API Routes with MongoDB
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
  console.log(`TaskFlow server on port ${PORT}`);
});
