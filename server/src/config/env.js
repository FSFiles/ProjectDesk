import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Load the root .env regardless of the process working directory.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config(); // also pick up a server-local .env if present

const cleanPort = () => {
  const raw = Number(process.env.PORT);
  return Number.isInteger(raw) && raw > 0 ? raw : 5000;
};

const required = (name, fallback = null) => {
  const value = process.env[name] ?? fallback;
  if (value === null || value === undefined || value === '') {
    // Only JWT_SECRET is hard-required; the rest have safe fallbacks.
    if (name === 'JWT_SECRET') {
      throw new Error(`Missing required environment variable: ${name}`);
    }
    return fallback;
  }
  return value;
};

// Origins allowed to call the API. The configured CLIENT_ORIGIN is always
// trusted; in development we also trust the Vite defaults (5173/5174) so a
// port bump never breaks CORS mid-session. Production stays strict.
const buildOrigins = () => {
  const configured = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  const isProd = (process.env.NODE_ENV || 'development') === 'production';
  const devDefaults = isProd ? [] : ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'];
  return [...new Set([...configured, ...devDefaults])];
};

export const config = {
  env: process.env.NODE_ENV || 'development',
  isProd: (process.env.NODE_ENV || 'development') === 'production',
  port: cleanPort(),
  serverUrl: process.env.SERVER_URL || `http://localhost:${cleanPort()}`,
  mongoUri: required('MONGO_URI', 'mongodb://127.0.0.1:27017/projectdesk'),
  jwtSecret: required('JWT_SECRET', 'projectdesk_dev_secret_change_me'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  allowedOrigins: buildOrigins(),
  authRateLimitMax: Number(process.env.AUTH_RATE_LIMIT_MAX) || 40,
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  },
};

export const isCloudinaryConfigured = () =>
  Boolean(config.cloudinary.cloudName && config.cloudinary.apiKey && config.cloudinary.apiSecret);
