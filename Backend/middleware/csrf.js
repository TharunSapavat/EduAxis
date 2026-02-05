/**
 * CSRF Protection Middleware
 * Using csrf-csrf package for double submit cookie pattern
 */

import { doubleCsrf } from 'csrf-csrf';
import crypto from 'crypto';

const SECRET = process.env.CSRF_SECRET || 'your-csrf-secret-change-in-production';

const csrfOptions = {
  getSecret: () => SECRET,
  cookieName: 'x-csrf-token',
  cookieOptions: {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    signed: false,
  },
  size: 64,
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
  getTokenFromRequest: (req) => {
    return req.headers['x-csrf-token'];
  },
};

const {
  invalidCsrfTokenError,
  doubleCsrfProtection,
} = doubleCsrf(csrfOptions);

// Simple token generator - create a random CSRF token
const generateToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Custom error handler for CSRF
export const csrfErrorHandler = (error, req, res, next) => {
  if (error === invalidCsrfTokenError) {
    return res.status(403).json({
      success: false,
      message: 'Invalid CSRF token',
    });
  }
  next(error);
};

// Middleware to generate and send CSRF token
export const csrfTokenGenerator = (req, res, next) => {
  const token = generateToken();
  res.setHeader('X-CSRF-Token', token);
  req.csrfToken = token;
  res.locals.csrfToken = token;
  next();
};

export { doubleCsrfProtection };
export default doubleCsrfProtection;
