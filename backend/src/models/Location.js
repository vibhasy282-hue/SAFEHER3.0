const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  latitude: {
    type: Number,
    required: true
  },
  longitude: {
    type: Number,
    required: true
  },
  accuracy: {
    type: Number,
    default: 0
  },
  altitude: Number,
  speed: Number,
  heading: Number,
  address: String,
  placeName: String,
  isSafe: {
    type: Boolean,
    default: true
  },
  safetyScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 80
  },
  nearbySafeSpots: [{
    name: String,
    type: { type: String, enum: ['police', 'hospital', 'fire_station', 'crowded_area', 'shop', 'other'] },
    distance: Number,
    latitude: Number,
    longitude: Number
  }],
  sessionId: {
    type: String,
    index: true
  },
  isEmergency: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// TTL index for old locations (keep for 7 days)
locationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 604800 });
locationSchema.index({ user: 1, createdAt: -1 });
locationSchema.index({ latitude: 1, longitude: 1 });

module.exports = mongoose.model('Location', locationSchema);
