import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { authRouter } from './routes/auth.js';
import { authMiddleware } from './middleware/auth.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Connect MongoDB
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/sokotally';
mongoose.connect(mongoUri).then(() => {
  console.log('MongoDB connected');
}).catch((e) => {
  console.error('MongoDB connection error', e);
  process.exit(1);
});

app.get('/health', (_req, res) => res.json({ ok: true }));

// Auth routes (register/login)
app.use('/auth', authRouter);

// Example protected route (replace with real resources)
app.get('/me', authMiddleware, (req, res) => {
  res.json({ userId: req.userId });
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log('API listening on port', port);
});
