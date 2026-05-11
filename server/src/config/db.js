const mongoose = require('mongoose');
const logger = require('../utils/logger');

const MAX_RETRIES = 5;
let retryCount = 0;

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    logger.fatal('MONGO_URI environment variable is not set. Exiting.');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 2,
    });
    retryCount = 0;
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    logger.info(`Database Name: ${conn.connection.db.databaseName}`);
  } catch (error) {
    logger.error({ err: error.message }, 'MongoDB Connection Error');
    retryCount++;
    if (retryCount >= MAX_RETRIES) {
      logger.fatal(`MongoDB failed to connect after ${MAX_RETRIES} attempts. Exiting.`);
      process.exit(1);
    }
    logger.info(`Retrying connection in 5 seconds (attempt ${retryCount}/${MAX_RETRIES})...`);
    setTimeout(connectDB, 5000);
  }
};

module.exports = connectDB;
