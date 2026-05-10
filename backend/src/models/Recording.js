const mongoose = require('mongoose');

const recordingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  emergencyLog: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EmergencyLog',
    default: null
  },
  type: {
    type: String,
    enum: ['video', 'audio', 'image'],
    required: true
  },
  originalUrl: {
    type: String,
    required: true
  },
  encryptedUrl: {
    type: String,
    required: true
  },
  cloudinaryId: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    default: 0
  },
  fileSize: {
    type: Number,
    default: 0
  },
  location: {
    latitude: Number,
    longitude: Number,
    address: String
  },
  aiAnalysis: {
    emotionDetected: String,
    voiceKeywords: [String],
    threatLevel: {
      type: String,
      enum: ['none', 'low', 'medium', 'high', 'critical']
    }
  },
  isEvidence: {
    type: Boolean,
    default: false
  },
  metadata: {
    device: String,
    browser: String,
    os: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

recordingSchema.index({ user: 1, createdAt: -1 });
recordingSchema.index({ emergencyLog: 1 });
recordingSchema.index({ isEvidence: 1 });

module.exports = mongoose.model('Recording', recordingSchema);
