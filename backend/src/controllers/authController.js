const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const logger = require('../utils/logger');
const { encrypt } = require('../utils/encryption');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret_key', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET || 'fallback_refresh_key', {
    expiresIn: '30d'
  });
};

exports.register = async (req, res) => {
  try {
    const { name, email, phone, password, emergencyCode } = req.body;

    // Check if MongoDB is connected
    if (!mongoose.connection.readyState) {
      return res.status(503).json({
        success: false,
        message: 'Database not available. Please use guest login for demo mode.'
      });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { phone }] }).maxTimeMS(5000);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or phone already exists'
      });
    }

    const user = await User.create({
      name,
      email,
      phone,
      password,
      emergencyCode: emergencyCode ? encrypt(emergencyCode) : null
    });

    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    logger.error('Registration error:', error);
    if (error.name === 'MongooseError' || error.message.includes('buffering timed out')) {
      return res.status(503).json({
        success: false,
        message: 'Database not available. Please use guest login for demo mode.'
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if MongoDB is connected
    if (!mongoose.connection.readyState) {
      return res.status(503).json({
        success: false,
        message: 'Database not available. Please use guest login for demo mode.'
      });
    }

    const user = await User.findOne({ email }).select('+password').maxTimeMS(5000);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    user.isOnline = true;
    await user.save();

    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        settings: user.settings
      }
    });
  } catch (error) {
    logger.error('Login error:', error);
    if (error.name === 'MongooseError' || error.message.includes('buffering timed out')) {
      return res.status(503).json({
        success: false,
        message: 'Database not available. Please use guest login for demo mode.'
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.logout = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user) {
      user.isOnline = false;
      user.socketId = null;
      await user.save();
    }
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('guardians', 'name email phone');
    res.json({ success: true, user });
  } catch (error) {
    logger.error('Get me error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const updates = req.body;
    const allowedUpdates = ['name', 'phone', 'avatar', 'settings', 'emergencyCode'];
    const updateData = {};

    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updateData[key] = updates[key];
      }
    });

    if (updateData.emergencyCode) {
      updateData.emergencyCode = encrypt(updateData.emergencyCode);
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({ success: true, user });
  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(401).json({ success: false, message: 'Refresh token required' });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const token = generateToken(decoded.id);

    res.json({ success: true, token });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid refresh token' });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Generate reset token
    const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = Date.now() + 3600000; // 1 hour
    await user.save();

    // In production, send email with reset link
    res.json({
      success: true,
      message: 'Password reset token generated',
      resetToken // In production, don't return this in response
    });
  } catch (error) {
    logger.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired token' });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({ success: true, message: 'Password reset successful' });
  } catch (error) {
    logger.error('Reset password error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Guest login for demo mode - no database required
exports.guestLogin = async (req, res) => {
  try {
    // Generate a guest token
    const guestId = 'guest_' + Date.now();
    const token = generateToken(guestId);
    const refreshToken = generateRefreshToken(guestId);

    res.json({
      success: true,
      message: 'Guest login successful',
      token,
      refreshToken,
      user: {
        id: guestId,
        name: 'Guest User',
        email: 'guest@safeher.demo',
        phone: '+1234567890',
        role: 'user',
        settings: {
          autoSOS: true,
          voiceDetection: true,
          webcamMonitoring: true,
          gestureDetection: true,
          keyboardSOS: true,
          backgroundMonitoring: true,
          shareLocation: true
        },
        isGuest: true
      }
    });
  } catch (error) {
    logger.error('Guest login error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
