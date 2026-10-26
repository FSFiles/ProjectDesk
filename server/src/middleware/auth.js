import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/** Verify the Bearer JWT and attach the loaded user to req.user. */
export const requireAuth = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : null;
  if (!token) {
    throw ApiError.unauthorized('Authentication required. Please log in.');
  }

  let decoded;
  try {
    decoded = jwt.verify(token, config.jwtSecret);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw ApiError.unauthorized('Your session has expired. Please log in again.');
    }
    throw ApiError.unauthorized('Invalid authentication token. Please log in again.');
  }

  const user = await User.findById(decoded.sub);
  if (!user) {
    throw ApiError.unauthorized('Account no longer exists. Please log in again.');
  }

  req.user = user;
  next();
});

/** Restrict a route to specific roles, e.g. requireRole('faculty'). */
export const requireRole =
  (...roles) =>
  (req, _res, next) => {
    if (!req.user) return next(ApiError.unauthorized('Authentication required. Please log in.'));
    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden('Access restricted. You do not have permission to perform this action.'));
    }
    return next();
  };
