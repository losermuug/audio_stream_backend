const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI is missing. Add your MongoDB Atlas connection string to .env');
  }

  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, {
    dbName: process.env.MONGODB_DB_NAME || undefined,
  });
}

module.exports = connectDB;
