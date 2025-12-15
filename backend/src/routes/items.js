import { Router } from 'express';
import Item from '../models/Item.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// List items
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const items = await Item.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(items);
  } catch (e) { next(e); }
});

// Create item
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const doc = await Item.create({ ...req.body, userId: req.userId });
    res.status(201).json(doc);
  } catch (e) { next(e); }
});

// Update item
router.patch('/:id', authMiddleware, async (req, res, next) => {
  try {
    const doc = await Item.findOneAndUpdate({ _id: req.params.id, userId: req.userId }, req.body, { new: true });
    if (!doc) return res.status(404).json({ error: 'Not Found' });
    res.json(doc);
  } catch (e) { next(e); }
});

// Delete item
router.delete('/:id', authMiddleware, async (req, res, next) => {
  try {
    const out = await Item.deleteOne({ _id: req.params.id, userId: req.userId });
    res.json({ ok: out.deletedCount === 1 });
  } catch (e) { next(e); }
});

export default router;


