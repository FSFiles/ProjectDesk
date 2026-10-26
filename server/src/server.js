import http from 'node:http';
import jwt from 'jsonwebtoken';
import { Server } from 'socket.io';
import { config } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/db.js';
import { createApp } from './app.js';
import { setSocketIO } from './services/notification.service.js';
import { ensureFacultyAccounts } from './utils/facultyAccounts.js';
import { User } from './models/User.js';

let started = false; // hard guard: listen() must only ever happen once per process

const start = async () => {
  if (started) return;
  started = true;

  await connectDatabase();

  // Idempotent bootstrap of the 5 authorized faculty accounts, so any freshly
  // connected database (e.g. MongoDB Atlas on Render) always has them and no
  // separate seed step is required. Creates only missing accounts — existing
  // accounts and their passwords are never touched.
  try {
    await ensureFacultyAccounts(User, console.log);
  } catch (err) {
    console.error('[boot] faculty account bootstrap failed:', err?.message || err);
  }

  const app = createApp();
  const server = http.createServer(app);

  const io = new Server(server, {
    cors: { origin: config.clientOrigin.split(',').map((o) => o.trim()), methods: ['GET', 'POST'] },
  });

  // Lightweight socket auth using the same JWT.
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication required'));
      const decoded = jwt.verify(token, config.jwtSecret);
      socket.data.userId = decoded.sub;
      socket.data.role = decoded.role;
      return next();
    } catch {
      return next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(`user:${socket.data.userId}`);
    socket.emit('notification:connected', { userId: socket.data.userId });
  });

  setSocketIO(io);

  // If the port is held by a stale instance of THIS project, replace it
  // gracefully instead of crashing with EADDRINUSE (dev convenience only).
  server.on('error', (err) => {
    if (err?.code === 'EADDRINUSE') {
      console.error(`[server] port ${config.port} is already in use.`);
      console.error('[server] Run `npm run dev` from the project root — it frees stale ProjectDesk processes first.');
      console.error('[server] Exiting so the port owner is not fought over.');
      process.exit(1);
    }
    console.error('[server] HTTP server error:', err?.message || err);
  });

  server.listen(config.port, () => {
    console.log(`[server] ProjectDesk API listening on ${config.serverUrl} (${config.env})`);
  });

  const shutdown = async () => {
    console.log('\n[server] shutting down...');
    server.close();
    io.close();
    await disconnectDatabase();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  // Never crash the whole app on stray async errors (errors inside request
  // handlers already reach the centralized error middleware).
  process.on('unhandledRejection', (reason) => {
    console.error('[server] unhandled promise rejection:', reason?.message || reason);
  });
};

start().catch((err) => {
  console.error('[server] failed to start:', err.message);
  process.exit(1);
});
