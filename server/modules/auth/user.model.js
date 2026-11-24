const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const { OFFICIAL_DEPARTMENTS } = require('../../config/constants');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, default: () => 'Mitra@' + Math.floor(100000 + Math.random() * 900000) },
  role: { type: String, enum: ['student', 'admin'], default: 'student' },
  department: {
    type: String,
    enum: OFFICIAL_DEPARTMENTS,
    default: 'CSE'
  },
  status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' },
  themePreferences: {
    mode: { type: String, enum: ['light', 'dark', 'system'], default: 'light' },
    primaryColor: { type: String, default: '#2563EB' },
    sidebarColor: { type: String, default: 'default' },
    customPrimaryColor: { type: String, default: '' },
    customSidebarColor: { type: String, default: '' }
  },
  resetPasswordToken: { type: String, default: null },
  resetPasswordExpires: { type: Date, default: null },
  loginOtp: { type: String, default: null },
  loginOtpExpires: { type: Date, default: null },
  loginOtpAttempts: { type: Number, default: 0 },
  lastOtpSentAt: { type: Date, default: null },
  otpRequestCount: { type: Number, default: 0 },
  otpWindowStart: { type: Date, default: null },
  otpLockedUntil: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now }
});

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
