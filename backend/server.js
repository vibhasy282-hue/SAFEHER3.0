const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const { initializeSocketHandler } = require('./src/socket/socketHandler');
const { connectDB } = require('./src/utils/db');
const logger = require('./src/utils/logger');
const errorHandler = require('./src/middleware/errorHandler');

const authRoutes = require('./src/routes/auth');
const emergencyRoutes = require('./src/routes/emergency');
const contactRoutes = require('./src/routes/contacts');
const recordingRoutes = require('./src/routes/recordings');
const locationRoutes = require('./src/routes/locations');
const alertRoutes = require('./src/routes/alerts');
const aiRoutes = require('./src/routes/ai');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false
}));
app.use(compression());
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// Strict rate limit for emergency endpoints
const emergencyLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Emergency rate limit exceeded.' }
});

// Body parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static uploads
app.use('/uploads', express.static('uploads'));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/emergency', emergencyLimiter, emergencyRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/recordings', recordingRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/ai', aiRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'SafeHer API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler
app.use(errorHandler);

// Socket.IO initialization
initializeSocketHandler(io);

// Database connection and server start
const startServer = () => {
  server.listen(PORT, () => {
    logger.info(`SafeHer server running on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
};

connectDB().then(() => {
  logger.info('MongoDB connected successfully');
  startServer();
}).catch(err => {
  logger.error('MongoDB connection failed:', err.message);
  logger.warn('Starting server without database - some features will not work');
  startServer();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    mongoose.connection.close(false, () => {
      process.exit(0);
    });
  });
});

module.exports = { io };
