import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler, ok } from '../utils/asyncHandler.js';
import { validate } from '../utils/validate.js';

function signToken(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
}

const sessionPayload = (user) => ({
  token: signToken(user),
  user: user.toSafeJSON(),
});

/** POST /api/auth/register — students only (faculty accounts are provisioned separately). */
export const register = asyncHandler(async (req, res) => {
  validate(req);
  const { firstName, lastName, email, password } = req.body;

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw ApiError.conflict('An account with this email already exists. Try logging in instead.');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ firstName, lastName, email, passwordHash, role: 'student' });
  ok(res, sessionPayload(user), 201);
});

/** POST /api/auth/login — role-aware login shared by students and faculty. */
export const login = asyncHandler(async (req, res) => {
  validate(req);
  const { email, password, role } = req.body;

  const user = await User.findOne({ email: (email || '').toLowerCase() }).select('+passwordHash');
  if (!user) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const matches = await bcrypt.compare(password || '', user.passwordHash);
  if (!matches) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  // Portal separation: a student cannot log into the faculty portal and vice versa.
  if (role && user.role !== role) {
    throw ApiError.forbidden(
      user.role === 'faculty'
        ? 'This account is a faculty account. Please use the faculty portal.'
        : 'This account is a student account. Please use the student portal.'
    );
  }

  ok(res, sessionPayload(user));
});

/** GET /api/auth/me — resolve the current session (used on app boot). */
export const me = asyncHandler(async (req, res) => {
  ok(res, { user: req.user.toSafeJSON() });
});
