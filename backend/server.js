import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';

import authRoutes from './routes/auth.js';
import ticketRoutes from './routes/tickets.js';
import userRoutes from './routes/users.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Socket.IO connection
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('join_ticket', (ticketId) => {
    socket.join(`ticket_${ticketId}`);
    console.log(`User ${socket.id} joined ticket ${ticketId}`);
  });
  
  socket.on('leave_ticket', (ticketId) => {
    socket.leave(`ticket_${ticketId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Make io available to routes
app.set('io', io);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/users', userRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'HelpDesk Mini API is running',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      tickets: '/api/tickets',
      users: '/api/users'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/helpdesk')
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
});