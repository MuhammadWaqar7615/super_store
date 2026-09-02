const app = require('./app');
const mongoose = require('mongoose');
require('dotenv').config();

let isConnected;

const connectToDatabase = async () => {
  if (isConnected) {
    return;
  }
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/super_store_erp';
    const db = await mongoose.connect(MONGODB_URI);
    isConnected = db.connections[0].readyState;
    console.log('MongoDB connected successfully in Vercel Serverless Function');
  } catch (error) {
    console.error('Error connecting to database:', error);
  }
};

module.exports = async (req, res) => {
  await connectToDatabase();
  return app(req, res);
};
