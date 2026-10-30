const mongoose = require('mongoose');

const DB_HOST = process.env.DB_HOST || 'mongodb';
const DB_PORT = process.env.DB_PORT || 27017;
const DB_NAME = process.env.DB_NAME || 'taskflow';

const connectDB = async (retries = 10) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await mongoose.connect(`mongodb://${DB_HOST}:${DB_PORT}/${DB_NAME}`);
      console.log(`MongoDB connected: ${DB_HOST}:${DB_PORT}/${DB_NAME}`);
      return;
    } catch (error) {
      console.error(`MongoDB not ready (${attempt}/${retries}), retrying in 3s`);
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }
  console.error('Could not connect to MongoDB, giving up');
  process.exit(1);
};

module.exports = connectDB;
