import { config } from '../config/env.js';

/**
 * Centralized error middleware — the single place that converts errors into
 * safe JSON responses. Raw database / internal errors are never leaked.
 */
export function errorHandler(err, req, res, _next) {
  // Strict-mode CORS rejections (foreign origin): respond 403, log one line.
  if (err?.message === 'Not allowed by CORS') {
    if (!config.isProd) console.warn(`[403] CORS blocked origin: ${req.headers.origin || 'unknown'}`);
    return res.status(403).json({ success: false, message: 'Access restricted. This origin is not allowed.' });
  }

  let statusCode = err?.statusCode || 500;
  let message = err?.message || 'Something went wrong on the server. Please try again.';
  let details = err?.details;

  // Mongoose validation errors → 400 with field details.
  if (err?.name === 'ValidationError' && err.errors) {
    statusCode = 400;
    details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    message = details[0]?.message || 'Validation failed';
  }

  // Mongoose duplicate key errors → friendly 409 conflict messages.
  if (err?.name === 'MongoServerError' && err.code === 11000) {
    statusCode = 409;
    const fields = Object.keys(err.keyValue || {});
    if (fields.includes('email')) {
      message = 'An account with this email already exists. Try logging in instead.';
    } else if (fields.includes('projectId')) {
      message = 'A project with this ID already exists. Please retry.';
    } else if (fields.includes('teamCode')) {
      message = 'A team with this code already exists. Please retry.';
    } else if (fields.includes('titleKey')) {
      message = 'Duplicate project titles are not allowed.';
    } else if (fields.includes('userId') || fields.includes('teamLeaderId')) {
      message = 'You already belong to a team in this project.';
    } else {
      message = 'This record already exists.';
    }
  }

  // Malformed JSON or bad request shapes.
  if (err?.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'Malformed request body.';
  }

  // Cast errors (bad ObjectId) → bad request.
  if (err?.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid identifier supplied.';
  }

  // Write conflicts from concurrent operations → safe 409 retry conflict.
  if (err?.code === 112 || err?.code === 251 || err?.hasErrorLabel === 'TransientTransactionError') {
    statusCode = 409;
    message = 'The resource was just modified by someone else. Please try again.';
  }

  if (statusCode >= 500) {
    // Log full details server-side only; never expose internals to clients.
    console.error(`[error] ${req.method} ${req.originalUrl}`, err);
    message = 'Something went wrong on the server. Please try again.';
  }

  if (!config.isProd && statusCode < 500) {
    console.warn(`[${statusCode}] ${req.method} ${req.originalUrl} → ${message}`);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(details ? { details } : {}),
  });
}

/** 404 handler for unknown API routes. */
export function notFoundHandler(req, res) {
  res.status(404).json({ success: false, message: 'Resource not found' });
}
