const Location = require('../models/Location');
const User = require('../models/User');
const logger = require('../utils/logger');
const { getIO } = require('../socket/socketHandler');

exports.updateLocation = async (req, res) => {
  try {
    const { latitude, longitude, accuracy, altitude, speed, heading, address, placeName, sessionId, nearbySafeSpots } = req.body;

    const location = await Location.create({
      user: req.user.id,
      latitude,
      longitude,
      accuracy,
      altitude,
      speed,
      heading,
      address,
      placeName,
      sessionId,
      nearbySafeSpots,
      createdAt: new Date()
    });

    // Update user's last location
    await User.findByIdAndUpdate(req.user.id, {
      lastLocation: {
        latitude,
        longitude,
        timestamp: new Date(),
        address
      }
    });

    // Emit to guardians
    const io = getIO();
    const user = await User.findById(req.user.id).populate('guardians');
    if (user && user.guardians) {
      user.guardians.forEach(guardian => {
        io.to(`user_${guardian._id}`).emit('location_update', {
          userId: req.user.id,
          userName: user.name,
          location: { latitude, longitude, accuracy, address, timestamp: location.createdAt }
        });
      });
    }

    res.json({ success: true, location });
  } catch (error) {
    logger.error('Update location error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getLocationHistory = async (req, res) => {
  try {
    const { page = 1, limit = 50, sessionId, startDate, endDate } = req.query;
    const query = { user: req.user.id };

    if (sessionId) query.sessionId = sessionId;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const locations = await Location.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Location.countDocuments(query);

    res.json({
      success: true,
      locations,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    logger.error('Get location history error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCurrentLocation = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('lastLocation isOnline');
    res.json({
      success: true,
      location: user.lastLocation,
      isOnline: user.isOnline
    });
  } catch (error) {
    logger.error('Get current location error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getGuardianTracking = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(req.user.id);

    // Check if requester is a guardian of the target user
    const targetUser = await User.findById(userId);
    if (!targetUser || !targetUser.guardians.includes(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Not authorized to track this user' });
    }

    const recentLocations = await Location.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({
      success: true,
      user: {
        id: targetUser._id,
        name: targetUser.name,
        isOnline: targetUser.isOnline,
        lastLocation: targetUser.lastLocation
      },
      locations: recentLocations
    });
  } catch (error) {
    logger.error('Get guardian tracking error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getNearbySafeSpots = async (req, res) => {
  try {
    const { latitude, longitude, radius = 5000 } = req.query;

    // Find recent locations with nearby safe spots
    const locations = await Location.find({
      user: req.user.id,
      'nearbySafeSpots.0': { $exists: true }
    })
      .sort({ createdAt: -1 })
      .limit(1);

    if (locations.length > 0 && locations[0].nearbySafeSpots) {
      return res.json({ success: true, safeSpots: locations[0].nearbySafeSpots });
    }

    // Return mock safe spots if none found
    const mockSafeSpots = [
      { name: 'City Police Station', type: 'police', distance: 800, latitude: parseFloat(latitude) + 0.005, longitude: parseFloat(longitude) + 0.003 },
      { name: 'General Hospital', type: 'hospital', distance: 1200, latitude: parseFloat(latitude) - 0.004, longitude: parseFloat(longitude) + 0.006 },
      { name: 'Fire Station 12', type: 'fire_station', distance: 1500, latitude: parseFloat(latitude) + 0.007, longitude: parseFloat(longitude) - 0.002 }
    ];

    res.json({ success: true, safeSpots: mockSafeSpots });
  } catch (error) {
    logger.error('Get nearby safe spots error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
