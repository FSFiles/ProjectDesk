import mongoose from 'mongoose';
import { config } from './env.js';

mongoose.set('strictQuery', true);

export async function connectDatabase() {
  const uri = config.mongoUri;
  const dbNameFromUri = uri.split('/').pop()?.split('?')[0];
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 8000,
  });
  const dbName = mongoose.connection.name || dbNameFromUri;
  console.log(`[db] MongoDB connected → ${mongoose.connection.host}/${dbName}`);
  return mongoose.connection;
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
}
