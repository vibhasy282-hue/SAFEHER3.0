const mongoose = require('mongoose');
const logger = require('./logger');

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI not defined in environment');
    }
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error(`MongoDB connection error: ${error.message}`);
    throw error;
  }
};

module.exports = { connectDB };
