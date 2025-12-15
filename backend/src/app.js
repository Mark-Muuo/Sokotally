import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Routes
import { authRouter } from './routes/auth.js';
import itemsRouter from './routes/items.js';
import transactionsRouter from './routes/transactions.js';
import chatRouter from './routes/chat.js';

// Middleware
import errorHandler from './middleware/errorHandler.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Core middleware
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));

// Static assets (uploads)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health
app.get('/health', (_req, res) => res.json({ ok: true }));

// API routes
// Routes (non-versioned)
app.use('/auth', authRouter);
app.use('/api/items', itemsRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/chat', chatRouter);

// 404 handler
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// Central error handler
app.use(errorHandler);

export default app;


