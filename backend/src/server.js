import express from 'express';
import cors from 'cors';
const app = express();
app.use(cors());
app.use(express.json());

// In-memory stores (replace with DB later)
const users = [];
const sessions = new Map();
const transactions = [];

app.get('/health', (_req, res) => res.json({ ok: true }));

app.post('/auth/register', (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' });
  if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) return res.status(409).json({ error: 'Email exists' });
  const user = { id: String(Date.now()), name, email, password };
  users.push(user);
  return res.status(201).json({ id: user.id, name, email });
});

app.post('/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  const user = users.find(u => u.email.toLowerCase() === email?.toLowerCase() && u.password === password);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const token = Math.random().toString(36).slice(2);
  sessions.set(token, user.id);
  return res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
});

function auth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const userId = token && sessions.get(token);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  req.userId = userId;
  next();
}

app.get('/transactions', auth, (_req, res) => { res.json({ items: transactions }); });
app.post('/transactions', auth, (req, res) => {
  const tx = { id: String(Date.now()), ...req.body };
  transactions.push(tx);
  res.status(201).json(tx);
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log('API listening on port', port);
});
