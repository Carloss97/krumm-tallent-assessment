import express from 'express';
import cors from 'cors';
import { saveSession, getSession, getAllSessions } from './db.js';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.post('/api/session', (req, res) => {
  const payload = req.body;

  if (!payload || Object.keys(payload).length === 0) {
    return res.status(400).json({ error: 'Empty session payload' });
  }

  try {
    const sessionId = saveSession(payload);
    return res.status(201).json({ sessionId, message: 'Session saved' });
  } catch (error) {
    console.error('Error saving session', error);
    return res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/session/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid session id' });

  const session = getSession(id);
  if (!session) return res.status(404).json({ error: 'Session not found' });

  return res.json(session);
});

app.get('/api/sessions', (req, res) => {
  const sessions = getAllSessions();
  return res.json(sessions);
});

app.listen(PORT, () => {
  console.log(`Backend API server running at http://localhost:${PORT}`);
});
