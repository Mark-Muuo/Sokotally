import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, unique: true, trim: true },
  passwordHash: { type: String, required: true },
  firstName: { type: String, trim: true },
  lastName: { type: String, trim: true },
  town: { type: String, trim: true },
  gender: { type: String, enum: ['Male', 'Female', 'Other', ''], default: '' },
  ageRange: { type: String, enum: ['<18', '18-25', '26-35', '36-50', '50+',''], default: '' }
}, { timestamps: true });

export const User = mongoose.model('User', userSchema);
