const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mitra_employability', {
      serverSelectionTimeoutMS: 5000
    });
    console.log(`[MongoDB Connected]: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`[MongoDB Connection Warning]: Could not connect to MongoDB at ${process.env.MONGO_URI || '127.0.0.1'}. Falling back to MongoMemoryServer...`);
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create({
        binary: { version: '6.0.12' }
      });
      const uri = mongod.getUri();
      const conn = await mongoose.connect(uri);
      console.log(`[MongoMemoryServer Connected]: ${conn.connection.host}`);
    } catch (memErr) {
      console.error(`[MongoDB Connection Error]: ${error.message}`);
      console.error(`Could not initialize MongoMemoryServer fallback: ${memErr.message}`);
    }
  }
};

module.exports = connectDB;
