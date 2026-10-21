import mongoose from 'mongoose';
import { config } from './env.js';

let mongoMemoryServerInstance = null;

export async function connectDB() {
  try {
    const isRemote = config.mongodbUri.startsWith('mongodb+srv://') || !config.mongodbUri.includes('127.0.0.1');
    const timeout = isRemote ? 10000 : 3000;
    
    // Attempt connecting to the configured MongoDB URI
    await mongoose.connect(config.mongodbUri, {
      serverSelectionTimeoutMS: timeout,
    });
    
    const safeUri = config.mongodbUri.replace(/:([^:@]+)@/, ':****@');
    console.log(`[Database] Connected successfully to MongoDB at ${safeUri}`);
  } catch (err) {
    console.warn(`[Database] MongoDB connection failed (${err.message}). Starting embedded MongoMemoryServer fallback...`);
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      mongoMemoryServerInstance = await MongoMemoryServer.create();
      const memoryUri = mongoMemoryServerInstance.getUri();
      await mongoose.connect(memoryUri);
      console.log(`[Database] Successfully connected to embedded in-memory MongoDB at ${memoryUri}`);
    } catch (memErr) {
      console.error('[Database] Fatal: Unable to initialize embedded MongoMemoryServer:', memErr);
      throw memErr;
    }
  }

  mongoose.connection.on('error', (err) => {
    console.error('[Database] Connection error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[Database] Mongoose disconnected');
  });
}

export async function disconnectDB() {
  await mongoose.disconnect();
  if (mongoMemoryServerInstance) {
    await mongoMemoryServerInstance.stop();
  }
}
