const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  priority: { type: String, default: 'medium' },
  category: { type: String, default: 'personal' },
  dueDate: { type: String, default: null },
  completed: { type: Boolean, default: false },
  completedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now }
});

// MongoDB uses _id; the frontend uses id. Send both.
TaskSchema.set('toJSON', { virtuals: true, versionKey: false });

module.exports = mongoose.model('Task', TaskSchema);
