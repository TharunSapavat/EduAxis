import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { AppError } from './errorHandler.js';
import { catchAsync } from './errorHandler.js';

// Middleware to verify JWT token from cookie
export const authMiddleware = catchAsync(async (req, res, next) => {
  // Get token from cookie
  const token = req.cookies.authToken;

  if (!token) {
    throw new AppError('No authentication token, access denied', 401);
  }

  // Verify token
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  // Find user
  const user = await User.findById(decoded._id).select('-password');

  if (!user) {
    throw new AppError('User not found', 401);
  }

  // Check if user is active
  if (user.status !== 'active') {
    throw new AppError('Account is not active', 403);
  }

  // Attach user to request
  req.user = user;
  req.userId = user._id;
  req.token = token;
  
  next();
});

// Middleware to check specific role
export const roleMiddleware = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(`Access denied. Required role: ${allowedRoles.join(' or ')}`, 403)
      );
    }

    next();
  };
};

 
 