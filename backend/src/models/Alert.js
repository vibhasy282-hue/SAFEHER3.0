const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  emergencyLog: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EmergencyLog',
    required: true
  },
  contact: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contact',
    required: true
  },
  type: {
    type: String,
    enum: ['sms', 'email', 'push', 'call', 'whatsapp'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'read', 'failed'],
    default: 'pending'
  },
  sentAt: {
    type: Date,
    default: Date.now
  },
  deliveredAt: Date,
  readAt: Date,
  errorMessage: String,
  locationShared: {
    type: Boolean,
    default: true
  },
  locationUrl: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

alertSchema.index({ user: 1, createdAt: -1 });
alertSchema.index({ emergencyLog: 1 });
alertSchema.index({ status: 1 });

module.exports = mongoose.model('Alert', alertSchema);
