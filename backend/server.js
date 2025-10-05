import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';

// Import routes
import authRoutes from './routes/auth.js';
import ticketRoutes from './routes/tickets.js';
import userRoutes from './routes/users.js';

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);

// ✅ Setup Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  },
});

// ✅ Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Socket.IO connection
io.on('connection', (socket) => {
  console.log('🟢 User connected:', socket.id);

  socket.on('join_ticket', (ticketId) => {
    socket.join(`ticket_${ticketId}`);
    console.log(`📩 User ${socket.id} joined ticket ${ticketId}`);
  });

  socket.on('leave_ticket', (ticketId) => {
    socket.leave(`ticket_${ticketId}`);
    console.log(`🚪 User ${socket.id} left ticket ${ticketId}`);
  });

  socket.on('disconnect', () => {
    console.log('🔴 User disconnected:', socket.id);
  });
});

// ✅ Make io available to routes
app.set('io', io);

// ✅ API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/users', userRoutes);

// ✅ Serve frontend in production
const __dirname = path.resolve();

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'frontend-build')));
  app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend-build', 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.json({
      message: 'HelpDesk Mini API is running 🚀',
      version: '1.0.0',
      endpoints: {
        auth: '/api/auth',
        tickets: '/api/tickets',
        users: '/api/users',
      },
    });
  });
}

// ✅ Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('🔥 Error:', err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error:
      process.env.NODE_ENV === 'development'
        ? err.message
        : 'Internal server error',
  });
});

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not defined in .env');
  process.exit(1);
}

mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then((conn) => {
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  })
  .catch((err) => {
    console.error(`❌ MongoDB Connection Error: ${err.message}`);
    process.exit(1);
  });


// ✅ Start the server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
