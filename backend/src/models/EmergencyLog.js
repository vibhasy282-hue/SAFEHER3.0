const mongoose = require('mongoose');

const emergencyLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['voice_distress', 'emotion_fear', 'gesture_sos', 'keyboard_sos', 'panic_button', 'manual_sos', 'ai_detected'],
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'high'
  },
  status: {
    type: String,
    enum: ['active', 'resolved', 'false_alarm', 'escalated'],
    default: 'active'
  },
  location: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    accuracy: Number,
    address: String,
    timestamp: { type: Date, default: Date.now }
  },
  triggeredBy: {
    type: String,
    enum: ['user', 'ai_voice', 'ai_emotion', 'ai_gesture', 'system', 'guardian'],
    default: 'user'
  },
  aiConfidence: {
    type: Number,
    min: 0,
    max: 1,
    default: 0
  },
  evidence: [{
    type: { type: String, enum: ['video', 'audio', 'image', 'text'] },
    url: String,
    encryptedUrl: String,
    timestamp: Date,
    cloudinaryId: String
  }],
  alertsSent: [{
    contact: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact' },
    method: { type: String, enum: ['sms', 'email', 'push', 'call'] },
    status: { type: String, enum: ['sent', 'delivered', 'failed'] },
    timestamp: { type: Date, default: Date.now }
  }],
  resolvedAt: Date,
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

emergencyLogSchema.index({ user: 1, createdAt: -1 });
emergencyLogSchema.index({ status: 1, createdAt: -1 });
emergencyLogSchema.index({ 'location.latitude': 1, 'location.longitude': 1 });

module.exports = mongoose.model('EmergencyLog', emergencyLogSchema);
