const EmergencyLog = require('../models/EmergencyLog');
const Location = require('../models/Location');
const Contact = require('../models/Contact');
const User = require('../models/User');
const { sendEmergencyAlert } = require('../services/alertService');
const { uploadToCloudinary } = require('../services/cloudStorage');
const { encrypt } = require('../utils/encryption');
const logger = require('../utils/logger');
const { getIO } = require('../socket/socketHandler');

exports.triggerSOS = async (req, res) => {
  try {
    const { type, location, triggeredBy, aiConfidence, evidence } = req.body;
    const userId = req.user.id;

    // Get user's emergency contacts
    const contacts = await Contact.find({ user: userId, isGuardian: true });

    // Create emergency log
    const emergencyLog = await EmergencyLog.create({
      user: userId,
      type: type || 'panic_button',
      severity: aiConfidence > 0.8 ? 'critical' : 'high',
      triggeredBy: triggeredBy || 'user',
      aiConfidence: aiConfidence || 0,
      location: {
        latitude: location?.latitude || 0,
        longitude: location?.longitude || 0,
        accuracy: location?.accuracy,
        address: location?.address,
        timestamp: new Date()
      }
    });

    // Save location
    if (location) {
      await Location.create({
        user: userId,
        ...location,
        isEmergency: true,
        createdAt: new Date()
      });
    }

    // Handle evidence upload
    if (evidence && evidence.length > 0) {
      for (const item of evidence) {
        try {
          const uploadResult = await uploadToCloudinary(item.data, item.type);
          emergencyLog.evidence.push({
            type: item.type,
            url: uploadResult.secure_url,
            encryptedUrl: encrypt(uploadResult.secure_url),
            timestamp: new Date(),
            cloudinaryId: uploadResult.public_id
          });
        } catch (uploadError) {
          logger.error('Evidence upload error:', uploadError);
        }
      }
      await emergencyLog.save();
    }

    // Send alerts to contacts
    const alertPromises = contacts.map(contact =>
      sendEmergencyAlert(contact, emergencyLog, req.user)
    );
    await Promise.allSettled(alertPromises);

    // Update alert status
    emergencyLog.alertsSent = contacts.map(contact => ({
      contact: contact._id,
      method: contact.notifyMethods.sms ? 'sms' : 'email',
      status: 'sent',
      timestamp: new Date()
    }));
    await emergencyLog.save();

    // Notify guardians via socket
    const io = getIO();
    contacts.forEach(contact => {
      io.to(`user_${contact._id}`).emit('emergency_alert', {
        emergencyId: emergencyLog._id,
        userId,
        userName: req.user.name,
        type: emergencyLog.type,
        location,
        timestamp: emergencyLog.createdAt
      });
    });

    logger.info(`Emergency triggered by user ${userId}: ${emergencyLog._id}`);

    res.status(201).json({
      success: true,
      message: 'SOS triggered successfully',
      emergencyId: emergencyLog._id,
      alertsSent: contacts.length
    });
  } catch (error) {
    logger.error('SOS trigger error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.resolveEmergency = async (req, res) => {
  try {
    const { emergencyId, notes } = req.body;

    const emergencyLog = await EmergencyLog.findOneAndUpdate(
      { _id: emergencyId, user: req.user.id },
      {
        status: 'resolved',
        resolvedAt: new Date(),
        resolvedBy: req.user.id,
        notes
      },
      { new: true }
    );

    if (!emergencyLog) {
      return res.status(404).json({ success: false, message: 'Emergency log not found' });
    }

    // Notify that emergency is resolved
    const io = getIO();
    io.to(`user_${req.user.id}`).emit('emergency_resolved', {
      emergencyId: emergencyLog._id,
      resolvedAt: emergencyLog.resolvedAt
    });

    res.json({ success: true, message: 'Emergency resolved', emergencyLog });
  } catch (error) {
    logger.error('Resolve emergency error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getEmergencyHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const query = { user: req.user.id };
    if (status) query.status = status;

    const emergencies = await EmergencyLog.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('alertsSent.contact', 'name phone email');

    const count = await EmergencyLog.countDocuments(query);

    res.json({
      success: true,
      emergencies,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    logger.error('Get emergency history error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getEmergencyById = async (req, res) => {
  try {
    const emergencyLog = await EmergencyLog.findOne({
      _id: req.params.id,
      $or: [{ user: req.user.id }, { 'alertsSent.contact': req.user.id }]
    }).populate('user', 'name phone email')
      .populate('alertsSent.contact', 'name phone email');

    if (!emergencyLog) {
      return res.status(404).json({ success: false, message: 'Emergency not found' });
    }

    res.json({ success: true, emergencyLog });
  } catch (error) {
    logger.error('Get emergency by id error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
