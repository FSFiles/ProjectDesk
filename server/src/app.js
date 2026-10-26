import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { config } from './config/env.js';
import router from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { uploadsDir } from './middleware/upload.js';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  // CORS: allow the resolved origin list (CLIENT_ORIGIN + dev defaults).
  // Foreign origins are rejected with a clean 403 JSON — never a crash.
  app.use(
    cors({
      origin(origin, cb) {
        if (!origin || config.allowedOrigins.includes(origin)) return cb(null, true);
        return cb(null, false); // no CORS headers → browser blocks; no throw
      },
      credentials: true,
    })
  );

  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  if (!config.isProd) app.use(morgan('dev'));

  // Locally stored uploads (fallback provider).
  app.use('/uploads', express.static(uploadsDir, { maxAge: '7d' }));

  app.get('/', (_req, res) => res.json({ name: 'ProjectDesk API', status: 'ok', docs: '/api/health' }));
  app.use('/api', router);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
