import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  // display name
  name: { type: String, required: true, trim: true },
  // auth identifiers
  username: { type: String, trim: true, unique: true, sparse: true },
  email: { type: String, trim: true, unique: true, sparse: true },
  phone: { type: String, required: true, unique: true, trim: true },
  passwordHash: { type: String, required: true },
  preferredLang: { type: String, enum: ['en', 'sw'], default: 'en' },

  // profile extras
  firstName: { type: String, trim: true },
  lastName: { type: String, trim: true },
  town: { type: String, trim: true },
  gender: { type: String, enum: ['Male', 'Female', 'Other', ''], default: '' },
  ageRange: { type: String, enum: ['<18', '18-25', '26-35', '36-50', '50+',''], default: '' },
  avatar: { type: String, default: '' },
  // transient OTP fields
  otpCode: { type: String, default: '' },
  otpExpires: { type: Date }
}, { timestamps: true });

export const User = mongoose.model('User', userSchema);
