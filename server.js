const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Data directory ────────────────────────────────────────────────────────────
const DATA_DIR = process.env.RENDER ? '/data' : path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
const DB_PATH = path.join(DATA_DIR, 'reel.json');

function readDB() {
  if (!fs.existsSync(DB_PATH)) return { profile: {}, history: [] };
  try { return JSON.parse(fs.readFileSync(DB_PATH, 'utf8')); }
  catch { return { profile: {}, history: [] }; }
}

function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// ── Blank starting state — no preloaded taste data ─────────────────────────────
function initDB() {
  const db = readDB();
  if (db.profile.services === undefined) {
    db.profile = {
      era: '',
      services: [],
      genres: [],
      actors: [],
      apiKey: ''
    };
    db.history = [];
    writeDB(db);
  }
  return db;
}

initDB();

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ── Claude proxy with full tool-loop handled server-side ──────────────────────
app.post('/api/recommend', async (req, res) => {
  const db = readDB();
  const apiKey = db.profile.apiKey;
  if (!apiKey) return res.status(401).json({ error: 'No API key configured. Add one in Profile settings.' });

  const { messages } = req.body;
  let msgs = [...messages];
  const system = 'You are a movie and TV expert with deep knowledge of what is available on streaming services. Make confident recommendations based on your knowledge. Your response MUST be ONLY a valid JSON array starting with [ and ending with ]. No markdown, no backticks, no explanation.';

  try {
    for (let turn = 0; turn < 12; turn++) {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1000,
          system,
          messages: msgs,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        return res.status(response.status).json({ error: err?.error?.message || `HTTP ${response.status}` });
      }

      const data = await response.json();
      if (!data.content) return res.status(500).json({ error: 'Empty response from Claude' });
      msgs.push({ role: 'assistant', content: data.content });

      if (data.stop_reason === 'end_turn') {
        const text = data.content.filter(b => b.type === 'text').map(b => b.text).join('');
        return res.json({ text, messages: msgs });
      }

      const toolUses = data.content.filter(b => b.type === 'tool_use');
      if (!toolUses.length) {
        const text = data.content.filter(b => b.type === 'text').map(b => b.text).join('');
        return res.json({ text, messages: msgs });
      }
    }
    res.status(500).json({ error: 'Max turns exceeded' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Profile API ───────────────────────────────────────────────────────────────
app.get('/api/profile', (req, res) => {
  const db = readDB();
  const { apiKey, ...safe } = db.profile;
  res.json({ ...safe, hasApiKey: !!apiKey });
});

app.post('/api/profile', (req, res) => {
  const db = readDB();
  db.profile = { ...db.profile, ...req.body };
  writeDB(db);
  res.json({ ok: true });
});

// ── History API ───────────────────────────────────────────────────────────────
app.get('/api/history', (req, res) => {
  const db = readDB();
  res.json(db.history);
});

app.post('/api/history', (req, res) => {
  const db = readDB();
  const maxId = db.history.reduce((m, h) => Math.max(m, h.id || 0), 0);
  const entry = { id: maxId + 1, ...req.body };
  db.history.push(entry);
  writeDB(db);
  res.json({ ok: true, id: entry.id });
});

app.delete('/api/history/:id', (req, res) => {
  const db = readDB();
  db.history = db.history.filter(h => h.id !== parseInt(req.params.id));
  writeDB(db);
  res.json({ ok: true });
});

// ── Catch-all ─────────────────────────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => console.log(`Reel running on port ${PORT}`));
