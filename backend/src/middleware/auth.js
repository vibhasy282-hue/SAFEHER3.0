const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized, no token' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');
    
    if (typeof decoded.id === 'string' && decoded.id.startsWith('guest_')) {
      req.user = {
        _id: decoded.id,
        id: decoded.id,
        name: 'Guest User',
        email: 'guest@safeher.demo',
        role: 'user',
        isGuest: true
      };
      return next();
    }

    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    next();
  } catch (error) {
    logger.error('Auth middleware error:', error);
    res.status(401).json({ success: false, message: 'Not authorized, token failed' });
  }
};

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Not authorized for this action' });
    }
    next();
  };
};

const optionalAuth = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');
      if (typeof decoded.id === 'string' && decoded.id.startsWith('guest_')) {
        req.user = { id: decoded.id, name: 'Guest User', role: 'user', isGuest: true };
      } else {
        req.user = await User.findById(decoded.id).select('-password');
      }
    }
    next();
  } catch (error) {
    next();
  }
};

module.exports = { protect, restrictTo, optionalAuth };
