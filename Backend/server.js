import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import connectDB from './config/database.js';
import authRoutes from './routes/authRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import teacherRoutes from './routes/teacherRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import { Server as SocketIOServer } from 'socket.io';
import morgan from 'morgan';
import helmet from 'helmet';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
const allowedOrigins = ['http://localhost:5173', 'http://localhost:5174'];
app.use(cors({
  origin: allowedOrigins,
  credentials: true // Allow cookies to be sent
}));
app.use(express.json());
app.use(cookieParser()); // Parse cookies

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Socket.IO setup
const io = new SocketIOServer(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true
  }
});
app.use(morgan('tiny'));
app.use(helmet());

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

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/messages', messageRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'EduAxis API is running!' });
});

server.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
