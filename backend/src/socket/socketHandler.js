const User = require('../models/User');
const EmergencyLog = require('../models/EmergencyLog');
const Location = require('../models/Location');
const logger = require('../utils/logger');

let io = null;

const initializeSocketHandler = (socketIO) => {
  io = socketIO;

  io.on('connection', (socket) => {
    logger.info(`Client connected: ${socket.id}`);

    // Authenticate socket connection
    socket.on('authenticate', async (token) => {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (user) {
          socket.userId = user._id.toString();
          socket.userRole = user.role;
          socket.join(`user_${user._id}`);

          // Update user's online status
          user.isOnline = true;
          user.socketId = socket.id;
          await user.save();

          socket.emit('authenticated', { success: true, userId: user._id });
          logger.info(`Socket authenticated for user: ${user._id}`);
        }
      } catch (error) {
        socket.emit('authenticated', { success: false, message: 'Authentication failed' });
        logger.error('Socket authentication error:', error);
      }
    });

    // Location updates from user
    socket.on('location_update', async (data) => {
      try {
        if (!socket.userId) return;

        // Save location
        await Location.create({
          user: socket.userId,
          ...data,
          createdAt: new Date()
        });

        // Update user's last location
        await User.findByIdAndUpdate(socket.userId, {
          lastLocation: {
            latitude: data.latitude,
            longitude: data.longitude,
            timestamp: new Date()
          }
        });

        // Broadcast to guardians
        const user = await User.findById(socket.userId).populate('guardians');
        if (user && user.guardians) {
          user.guardians.forEach(guardian => {
            io.to(`user_${guardian._id}`).emit('guardian_location_update', {
              userId: socket.userId,
              userName: user.name,
              location: data,
              timestamp: new Date()
            });
          });
        }
      } catch (error) {
        logger.error('Socket location update error:', error);
      }
    });

    // Emergency trigger via socket
    socket.on('emergency_trigger', async (data) => {
      try {
        if (!socket.userId) return;

        const emergencyLog = await EmergencyLog.create({
          user: socket.userId,
          type: data.type || 'manual_sos',
          severity: 'critical',
          triggeredBy: 'user',
          location: data.location,
          createdAt: new Date()
        });

        // Notify guardians
        const user = await User.findById(socket.userId).populate('guardians');
        if (user && user.guardians) {
          user.guardians.forEach(guardian => {
            io.to(`user_${guardian._id}`).emit('emergency_alert', {
              emergencyId: emergencyLog._id,
              userId: socket.userId,
              userName: user.name,
              type: emergencyLog.type,
              location: data.location,
              timestamp: emergencyLog.createdAt
            });
          });
        }

        socket.emit('emergency_acknowledged', { emergencyId: emergencyLog._id });
      } catch (error) {
        logger.error('Socket emergency trigger error:', error);
      }
    });

    // Guardian subscribes to user's location
    socket.on('subscribe_to_user', async (targetUserId) => {
      try {
        if (!socket.userId) return;

        const targetUser = await User.findById(targetUserId);
        if (targetUser && targetUser.guardians.includes(socket.userId)) {
          socket.join(`guardian_${targetUserId}`);
          socket.emit('subscribed', { userId: targetUserId, success: true });

          // Send current location immediately
          if (targetUser.lastLocation) {
            socket.emit('guardian_location_update', {
              userId: targetUserId,
              userName: targetUser.name,
              location: targetUser.lastLocation,
              timestamp: new Date()
            });
          }
        } else {
          socket.emit('subscribed', { userId: targetUserId, success: false, message: 'Not authorized' });
        }
      } catch (error) {
        logger.error('Subscribe to user error:', error);
      }
    });

    // Webcam snapshot sharing
    socket.on('webcam_snapshot', async (data) => {
      try {
        if (!socket.userId) return;

        // Broadcast to guardians
        const user = await User.findById(socket.userId).populate('guardians');
        if (user && user.guardians) {
          user.guardians.forEach(guardian => {
            io.to(`user_${guardian._id}`).emit('webcam_snapshot', {
              userId: socket.userId,
              userName: user.name,
              imageData: data.imageData,
              timestamp: new Date()
            });
          });
        }
      } catch (error) {
        logger.error('Webcam snapshot error:', error);
      }
    });

    // AI detection events
    socket.on('ai_detection', async (data) => {
      try {
        if (!socket.userId) return;

        io.to(`user_${socket.userId}`).emit('ai_detection_event', data);

        // Also notify guardians if threat level is high
        if (data.threatLevel === 'high' || data.threatLevel === 'critical') {
          const user = await User.findById(socket.userId).populate('guardians');
          if (user && user.guardians) {
            user.guardians.forEach(guardian => {
              io.to(`user_${guardian._id}`).emit('guardian_ai_alert', {
                userId: socket.userId,
                userName: user.name,
                ...data,
                timestamp: new Date()
              });
            });
          }
        }
      } catch (error) {
        logger.error('AI detection socket error:', error);
      }
    });

    // Disconnect handling
    socket.on('disconnect', async () => {
      logger.info(`Client disconnected: ${socket.id}`);
      if (socket.userId) {
        try {
          await User.findByIdAndUpdate(socket.userId, {
            isOnline: false,
            socketId: null
          });
        } catch (error) {
          logger.error('Disconnect update error:', error);
        }
      }
    });
  });
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};

module.exports = { initializeSocketHandler, getIO };
