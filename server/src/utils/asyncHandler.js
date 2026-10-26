/** Wrap an async route handler so rejections reach the error middleware. */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/** Small helper for uniform success payloads. */
export const ok = (res, data, statusCode = 200) => res.status(statusCode).json({ success: true, data });
