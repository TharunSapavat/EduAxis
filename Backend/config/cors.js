/**
 * CORS Configuration
 * Handles Cross-Origin Resource Sharing settings for the application
 */

/**
 * Get allowed origins from environment variable or use defaults
 * @returns {Array<string>} Array of allowed origins
 */
const getAllowedOrigins = () => {
  const envOrigins = process.env.CORS_ORIGINS;
  
  if (envOrigins) {
    return envOrigins.split(',').map(origin => origin.trim());
  }
  
  // Default origins for development
  return ['http://localhost:5173', 'http://localhost:5174'];
};

/**
 * CORS options configuration
 */
export const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = getAllowedOrigins();
    
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) {
      return callback(null, true);
    }
    
    // Check if the origin is in the allowed list
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`⚠️  CORS blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Allow cookies and authorization headers
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'X-CSRF-Token'
  ],
  exposedHeaders: ['Content-Range', 'X-Content-Range', 'X-CSRF-Token'],
  maxAge: 86400, // 24 hours - how long preflight requests can be cached
  optionsSuccessStatus: 200
};

/**
 * Socket.IO CORS configuration
 */
export const socketCorsOptions = {
  origin: getAllowedOrigins(),
  credentials: true,
  methods: ['GET', 'POST']
};

export default corsOptions;
