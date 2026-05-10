const Alert = require('../models/Alert');
const EmergencyLog = require('../models/EmergencyLog');
const logger = require('../utils/logger');

exports.getAlerts = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const query = { $or: [{ user: req.user.id }, { contact: req.user.id }] };
    if (status) query.status = status;

    const alerts = await Alert.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('user', 'name phone email')
      .populate('emergencyLog')
      .populate('contact', 'name phone email');

    const count = await Alert.countDocuments(query);

    res.json({
      success: true,
      alerts,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    logger.error('Get alerts error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateAlertStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const alert = await Alert.findOneAndUpdate(
      { _id: req.params.id, $or: [{ user: req.user.id }, { contact: req.user.id }] },
      { status, [`${status}At`]: new Date() },
      { new: true }
    );

    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alert not found' });
    }

    res.json({ success: true, alert });
  } catch (error) {
    logger.error('Update alert status error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getGuardianAlerts = async (req, res) => {
  try {
    const alerts = await Alert.find({ contact: req.user.id })
      .sort({ createdAt: -1 })
      .populate('user', 'name phone email')
      .populate('emergencyLog', 'type severity location status')
      .limit(50);

    res.json({ success: true, alerts });
  } catch (error) {
    logger.error('Get guardian alerts error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
