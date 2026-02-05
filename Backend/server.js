import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import helmet from 'helmet';
import morgan from 'morgan';
import { Server as SocketIOServer } from 'socket.io';

// Import configurations
import connectDB from './config/database.js';
import { corsOptions, socketCorsOptions } from './config/cors.js';
import helmetOptions from './config/helmet.js';
import { apiLimiter, authLimiter } from './config/rateLimit.js';
import logger from './config/logger.js';

// Import routes
import authRoutes from './routes/authRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import teacherRoutes from './routes/teacherRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import messageRoutes from './routes/messageRoutes.js';

// Import middleware
import errorHandler, { notFound } from './middleware/errorHandler.js';
import { doubleCsrfProtection, csrfTokenGenerator, csrfErrorHandler } from './middleware/csrf.js';

// Load environment variables
dotenv.config();

// Handle uncaught exceptions (must be at the top)
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...', err);
  process.exit(1);
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Security Middleware (must be first)
app.use(helmet(helmetOptions)); // Secure HTTP headers
app.use(cors(corsOptions)); // CORS configuration

// Trust proxy (if behind reverse proxy like nginx)
app.set('trust proxy', 1);

// Morgan stream to Winston logger
const morganStream = {
  write: (message) => {
    logger.info(message.trim());
  }
};

// Request logging with Morgan + Winston (both console and file)
if (process.env.NODE_ENV === 'development') {
  // Development: console (colorized) + file
  app.use(morgan('dev')); // Console output
  app.use(morgan('combined', { stream: morganStream })); // File output
} else {
  // Production: file only
  app.use(morgan('combined', { stream: morganStream }));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Socket.IO setup
const io = new SocketIOServer(server, {
  cors: socketCorsOptions
});

io.on('connection', (socket) => {
  console.log('🔌 Socket connected:', socket.id);
  // Allow clients to join a room for their user id so server can send direct messages
  socket.on('join', (payload) => {
    try {
      const userId = payload?.userId;
      if (userId) {
        socket.join(`user:${userId}`);
        console.log(`🔌 Socket ${socket.id} joined user:${userId}`);
      }
    } catch (err) {
      console.error('join error', err);
    }
  });

  // Typing indicator
  socket.on('typing:start', (payload) => {
    try {
      const { recipientId, senderId, senderName } = payload || {};
      if (recipientId && senderId) {
        io.to(`user:${recipientId}`).emit('typing:start', { senderId, senderName });
      }
    } catch (err) {
      console.error('typing:start error', err);
    }
  });

  socket.on('typing:stop', (payload) => {
    try {
      const { recipientId, senderId } = payload || {};
      if (recipientId && senderId) {
        io.to(`user:${recipientId}`).emit('typing:stop', { senderId });
      }
    } catch (err) {
      console.error('typing:stop error', err);
    }
  });

  socket.on('disconnect', () => {
    console.log('🔌 Socket disconnected:', socket.id);
  });

  // Optional: allow socket-created messages (prototype). Server will persist and emit.
  socket.on('message:create', async (payload) => {
    try {
      const { recipientId, text, senderId } = payload || {};
      if (!recipientId || !text || !senderId) return;
      // Lazy load model to avoid circular imports
      const Message = (await import('./models/Message.js')).default;
      const message = await Message.create({ sender: senderId, recipient: recipientId, text });
      await message.populate('sender', 'name email');
      io.to(`user:${recipientId}`).emit('message:received', message);
    } catch (err) {
      console.error('message:create failed', err);
    }
  });
});

// Make io available in routes/controllers
app.set('io', io);

// Health check endpoint (no rate limit)
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true,
    message: 'EduAxis API is running!',
    timestamp: new Date().toISOString()
  });
});

// CSRF token endpoint
app.get('/api/csrf-token', csrfTokenGenerator, (req, res) => {
  res.json({
    success: true,
    csrfToken: req.csrfToken
  });
});

// Apply rate limiting to all API routes
app.use('/api', apiLimiter);

// Routes - Auth routes don't need CSRF protection (login/register are public)
app.use('/api/auth', authLimiter, authRoutes);

// CSRF Protection for authenticated routes (student, teacher, admin, messages)
app.use(doubleCsrfProtection);
app.use(csrfErrorHandler);

// Protected routes with CSRF protection
app.use('/api/student', studentRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/messages', messageRoutes);

// 404 handler - must be after all routes
app.use(notFound);

// Global error handler - must be last
app.use(errorHandler);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! 💥 Shutting down...', {
    error: err.message,
    stack: err.stack
  });
  server.close(() => {
    process.exit(1);
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('👋 SIGTERM RECEIVED. Shutting down gracefully');
  server.close(() => {
    logger.info('💥 Process terminated!');
  });
});

server.listen(PORT, () => {
  logger.info(`🚀 Server is running on http://localhost:${PORT}`);
  logger.info(`📝 Environment: ${process.env.NODE_ENV}`);
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
