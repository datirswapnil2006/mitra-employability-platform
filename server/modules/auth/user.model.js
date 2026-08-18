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
  profilePhoto: { type: String, default: '' },
  status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' },
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
