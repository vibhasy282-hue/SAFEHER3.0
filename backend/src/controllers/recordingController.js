const Recording = require('../models/Recording');
const EmergencyLog = require('../models/EmergencyLog');
const { uploadToCloudinary } = require('../services/cloudStorage');
const { encrypt } = require('../utils/encryption');
const logger = require('../utils/logger');

exports.uploadRecording = async (req, res) => {
  try {
    const { type, emergencyLogId, location, aiAnalysis, duration } = req.body;

    if (!req.file && !req.body.data) {
      return res.status(400).json({ success: false, message: 'No recording data provided' });
    }

    let uploadResult;
    if (req.file) {
      const resourceType = type === 'audio' ? 'video' : type;
      uploadResult = await uploadToCloudinary(req.file.path, resourceType);
    } else {
      uploadResult = await uploadToCloudinary(req.body.data, type);
    }

    const recording = await Recording.create({
      user: req.user.id,
      emergencyLog: emergencyLogId || null,
      type,
      originalUrl: uploadResult.secure_url,
      encryptedUrl: encrypt(uploadResult.secure_url),
      cloudinaryId: uploadResult.public_id,
      duration,
      fileSize: req.file?.size || 0,
      location,
      aiAnalysis,
      isEvidence: !!emergencyLogId,
      metadata: {
        device: req.headers['user-agent'],
        browser: req.headers['sec-ch-ua'],
        os: req.headers['sec-ch-ua-platform']
      }
    });

    // Link to emergency log if provided
    if (emergencyLogId) {
      await EmergencyLog.findByIdAndUpdate(emergencyLogId, {
        $push: {
          evidence: {
            type,
            url: uploadResult.secure_url,
            encryptedUrl: encrypt(uploadResult.secure_url),
            timestamp: new Date(),
            cloudinaryId: uploadResult.public_id
          }
        }
      });
    }

    res.status(201).json({ success: true, recording });
  } catch (error) {
    logger.error('Upload recording error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getRecordings = async (req, res) => {
  try {
    const { type, page = 1, limit = 20, isEvidence } = req.query;
    const query = { user: req.user.id };

    if (type) query.type = type;
    if (isEvidence !== undefined) query.isEvidence = isEvidence === 'true';

    const recordings = await Recording.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('emergencyLog', 'type status createdAt');

    const count = await Recording.countDocuments(query);

    res.json({
      success: true,
      recordings,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    logger.error('Get recordings error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getRecordingById = async (req, res) => {
  try {
    const recording = await Recording.findOne({
      _id: req.params.id,
      user: req.user.id
    }).populate('emergencyLog');

    if (!recording) {
      return res.status(404).json({ success: false, message: 'Recording not found' });
    }

    res.json({ success: true, recording });
  } catch (error) {
    logger.error('Get recording by id error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteRecording = async (req, res) => {
  try {
    const recording = await Recording.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });

    if (!recording) {
      return res.status(404).json({ success: false, message: 'Recording not found' });
    }

    // Delete from cloudinary if needed
    // await deleteFromCloudinary(recording.cloudinaryId);

    res.json({ success: true, message: 'Recording deleted' });
  } catch (error) {
    logger.error('Delete recording error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
