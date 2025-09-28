import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { authMiddleware } from '../middleware/auth.js';

export const authRouter = Router();

function sign(user) {
  const payload = { sub: user.id, phone: user.phone };
  const secret = process.env.JWT_SECRET || 'dev-secret';
  const expiresIn = '7d';
  return jwt.sign(payload, secret, { expiresIn });
}

authRouter.post('/register', async (req, res) => {
  try {
    const { name, phone, password } = req.body || {};
    if (!name || !phone || !password) return res.status(400).json({ error: 'Missing fields' });
    
    // Normalize phone number (remove spaces, ensure it starts with +254)
    const normalizedPhone = phone.replace(/\s/g, '').startsWith('+254') ? phone.replace(/\s/g, '') : `+254${phone.replace(/^0/, '')}`;
    
    const exists = await User.findOne({ phone: normalizedPhone });
    if (exists) return res.status(409).json({ error: 'Phone number already registered' });
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, phone: normalizedPhone, passwordHash });
    const token = sign(user);
  return res.status(201).json({ token, user: { id: user.id, name: user.name, phone: user.phone, firstName: user.firstName || '', lastName: user.lastName || '', town: user.town || '', gender: user.gender || '', ageRange: user.ageRange || '' } });
  } catch (e) {
    return res.status(500).json({ error: 'Server error' });
  }
});

authRouter.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body || {};
    if (!phone || !password) return res.status(400).json({ error: 'Phone and password required' });
    
    // Normalize phone number
    const normalizedPhone = phone.replace(/\s/g, '').startsWith('+254') ? phone.replace(/\s/g, '') : `+254${phone.replace(/^0/, '')}`;
    
    const user = await User.findOne({ phone: normalizedPhone });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const token = sign(user);
  return res.json({ token, user: { id: user.id, name: user.name, phone: user.phone, firstName: user.firstName || '', lastName: user.lastName || '', town: user.town || '', gender: user.gender || '', ageRange: user.ageRange || '' } });
  } catch {
    return res.status(500).json({ error: 'Server error' });
  }
});

authRouter.post('/reset-password', async (req, res) => {
  try {
    const { phone, newPassword } = req.body || {};
    if (!phone || !newPassword) return res.status(400).json({ error: 'Phone and new password required' });
    
    // Normalize phone number
    const normalizedPhone = phone.replace(/\s/g, '').startsWith('+254') ? phone.replace(/\s/g, '') : `+254${phone.replace(/^0/, '')}`;
    
    const user = await User.findOne({ phone: normalizedPhone });
    if (!user) return res.status(404).json({ error: 'No account found for this phone number' });
    
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await User.findByIdAndUpdate(user.id, { passwordHash });
    
    return res.json({ message: 'Password updated successfully' });
  } catch {
    return res.status(500).json({ error: 'Server error' });
  }
});

// Get current user's profile
authRouter.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json({ user: { id: user.id, name: user.name, phone: user.phone, firstName: user.firstName || '', lastName: user.lastName || '', town: user.town || '', gender: user.gender || '', ageRange: user.ageRange || '' } });
  } catch {
    return res.status(500).json({ error: 'Server error' });
  }
});

// Update current user's profile (name/phone)
authRouter.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, phone, firstName, lastName, town, gender, ageRange } = req.body || {};
    const update = {};
    if (name) update.name = name;
    if (firstName !== undefined) update.firstName = firstName;
    if (lastName !== undefined) update.lastName = lastName;
    if (town !== undefined) update.town = town;
    if (gender !== undefined) update.gender = gender;
    if (ageRange !== undefined) update.ageRange = ageRange;
    if (phone) {
      const normalizedPhone = phone.replace(/\s/g, '').startsWith('+254') ? phone.replace(/\s/g, '') : `+254${phone.replace(/^0/, '')}`;
      update.phone = normalizedPhone;
    }
    if (Object.keys(update).length === 0) return res.status(400).json({ error: 'No fields to update' });
    const user = await User.findByIdAndUpdate(req.userId, update, { new: true });
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json({ user: { id: user.id, name: user.name, phone: user.phone, firstName: user.firstName || '', lastName: user.lastName || '', town: user.town || '', gender: user.gender || '', ageRange: user.ageRange || '' } });
  } catch {
    return res.status(500).json({ error: 'Server error' });
  }
});

// Refresh token endpoint
authRouter.post('/refresh', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const token = sign(user);
    return res.json({ token });
  } catch {
    return res.status(500).json({ error: 'Server error' });
  }
});
