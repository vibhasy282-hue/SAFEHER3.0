const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false
  },
  avatar: {
    type: String,
    default: null
  },
  role: {
    type: String,
    enum: ['user', 'guardian', 'admin'],
    default: 'user'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  emergencyCode: {
    type: String,
    default: null
  },
  settings: {
    autoSOS: { type: Boolean, default: true },
    voiceDetection: { type: Boolean, default: true },
    webcamMonitoring: { type: Boolean, default: true },
    gestureDetection: { type: Boolean, default: true },
    keyboardSOS: { type: Boolean, default: true },
    backgroundMonitoring: { type: Boolean, default: true },
    shareLocation: { type: Boolean, default: true }
  },
  lastLocation: {
    latitude: Number,
    longitude: Number,
    timestamp: Date,
    address: String
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  socketId: {
    type: String,
    default: null
  },
  guardians: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.virtual('contacts', {
  ref: 'Contact',
  localField: '_id',
  foreignField: 'user'
});

userSchema.virtual('emergencyLogs', {
  ref: 'EmergencyLog',
  localField: '_id',
  foreignField: 'user'
});

module.exports = mongoose.model('User', userSchema);
