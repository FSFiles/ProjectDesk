import { validationResult } from 'express-validator';
import { ApiError } from './apiError.js';

/**
 * Runs express-validator checks; throws a 400 ApiError with a clean
 * field-level details array when validation fails.
 */
export function validate(req) {
  const result = validationResult(req);
  if (result.isEmpty()) return;
  const details = result.array().map((e) => ({
    field: e.path || e.param,
    message: e.msg,
  }));
  throw ApiError.badRequest('Validation failed', details);
}
