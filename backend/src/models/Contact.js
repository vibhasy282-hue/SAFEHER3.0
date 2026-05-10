const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Contact name is required'],
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  relationship: {
    type: String,
    enum: ['family', 'friend', 'guardian', 'police', 'colleague', 'other'],
    default: 'family'
  },
  isGuardian: {
    type: Boolean,
    default: false
  },
  isPrimary: {
    type: Boolean,
    default: false
  },
  notifyMethods: {
    sms: { type: Boolean, default: true },
    email: { type: Boolean, default: true },
    call: { type: Boolean, default: false }
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verifiedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

contactSchema.index({ user: 1, isPrimary: -1 });
contactSchema.index({ user: 1, isGuardian: -1 });

module.exports = mongoose.model('Contact', contactSchema);
