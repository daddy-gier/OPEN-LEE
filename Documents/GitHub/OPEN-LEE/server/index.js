/**
 * OPEN-LEE Backend Proxy Server
 * Node.js + Express multi-AI aggregator proxy
 * Routes: Claude, ChatGPT, Mistral, Grok, Ollama (local)
 * Also serves as BuddySystem relay for UE5 NPC dialogue
 */

const express    = require('express');
const cors       = require('cors');
const axios      = require('axios');
const rateLimit  = require('express-rate-limit');
require('dotenv').config();

const app  = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));

// CORS — allow from local UE5 editor and OPEN-LEE frontend
app.use(cors({
  origin: [
    'http://localhost:3000',   // React frontend
    'http://localhost:7777',   // UE5 local server
    'http://127.0.0.1:3000',
    'http://127.0.0.1:7777',
    process.env.ALLOWED_ORIGIN || 'http://localhost:3000'
  ],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-openlee-key'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,             // 60 requests per minute per IP
  message: { error: 'rate_limited', message: 'Too many requests. Slow down.' }
});
app.use('/api/', limiter);

// Simple API key auth for UE5 requests
const requireAuth = (req, res, next) => {
  const key = req.headers['x-openlee-key'];
  if (process.env.OPENLEE_SECRET && key !== process.env.OPENLEE_SECRET) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  next();
};

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    project: 'OPEN-LEE',
    timestamp: new Date().toISOString(),
    models: {
      claude:  !!process.env.ANTHROPIC_API_KEY,
      openai:  !!process.env.OPENAI_API_KEY,
      mistral: !!process.env.MISTRAL_API_KEY,
      grok:    !!process.env.GROK_API_KEY,
      ollama:  true, // local, always available if running
    }
  });
});

// ─── CLAUDE (Anthropic) ───────────────────────────────────────────────────────
app.post('/api/claude', requireAuth, async (req, res) => {
  const { messages, system, model = 'claude-sonnet-4-5', max_tokens = 1024 } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'invalid_request', message: 'messages array required' });
  }

  try {
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      { model, max_tokens, system, messages },
      {
        headers: {
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    const text = response.data?.content?.[0]?.text || '';
    res.json({ text, model, provider: 'claude', raw: response.data });

  } catch (err) {
    handleProviderError(res, err, 'claude');
  }
});

// ─── OPENAI (ChatGPT) ─────────────────────────────────────────────────────────
app.post('/api/openai', requireAuth, async (req, res) => {
  const { messages, model = 'gpt-4o', max_tokens = 1024, temperature = 0.7 } = req.body;

  if (!messages) return res.status(400).json({ error: 'invalid_request', message: 'messages required' });

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      { model, messages, max_tokens, temperature },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    const text = response.data?.choices?.[0]?.message?.content || '';
    res.json({ text, model, provider: 'openai', raw: response.data });

  } catch (err) {
    handleProviderError(res, err, 'openai');
  }
});

// ─── MISTRAL ──────────────────────────────────────────────────────────────────
app.post('/api/mistral', requireAuth, async (req, res) => {
  const { messages, model = 'mistral-large-latest', max_tokens = 1024 } = req.body;

  try {
    const response = await axios.post(
      'https://api.mistral.ai/v1/chat/completions',
      { model, messages, max_tokens },
      {
        headers: {
          'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    const text = response.data?.choices?.[0]?.message?.content || '';
    res.json({ text, model, provider: 'mistral', raw: response.data });

  } catch (err) {
    handleProviderError(res, err, 'mistral');
  }
});

// ─── GROK (xAI) ───────────────────────────────────────────────────────────────
app.post('/api/grok', requireAuth, async (req, res) => {
  const { messages, model = 'grok-2-latest', max_tokens = 1024 } = req.body;

  try {
    const response = await axios.post(
      'https://api.x.ai/v1/chat/completions',
      { model, messages, max_tokens },
      {
        headers: {
          'Authorization': `Bearer ${process.env.GROK_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    const text = response.data?.choices?.[0]?.message?.content || '';
    res.json({ text, model, provider: 'grok', raw: response.data });

  } catch (err) {
    handleProviderError(res, err, 'grok');
  }
});

// ─── OLLAMA (local) ───────────────────────────────────────────────────────────
app.post('/api/ollama', requireAuth, async (req, res) => {
  const { prompt, model = 'mistral', stream = false } = req.body;
  const ollamaBase = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';

  try {
    const response = await axios.post(
      `${ollamaBase}/api/generate`,
      { model, prompt, stream },
      { timeout: 60000 }
    );

    const text = response.data?.response || '';
    res.json({ text, model, provider: 'ollama', raw: response.data });

  } catch (err) {
    handleProviderError(res, err, 'ollama');
  }
});

// ─── AGGREGATOR — run all models in parallel ───────────────────────────────────
app.post('/api/all', requireAuth, async (req, res) => {
  const { prompt, system } = req.body;
  if (!prompt) return res.status(400).json({ error: 'prompt required' });

  const userMsg = [{ role: 'user', content: prompt }];

  const calls = [
    axios.post(`http://localhost:${PORT}/api/claude`,   { messages: userMsg, system }, { headers: { 'x-openlee-key': process.env.OPENLEE_SECRET } }),
    axios.post(`http://localhost:${PORT}/api/openai`,   { messages: userMsg },         { headers: { 'x-openlee-key': process.env.OPENLEE_SECRET } }),
    axios.post(`http://localhost:${PORT}/api/mistral`,  { messages: userMsg },         { headers: { 'x-openlee-key': process.env.OPENLEE_SECRET } }),
    axios.post(`http://localhost:${PORT}/api/grok`,     { messages: userMsg },         { headers: { 'x-openlee-key': process.env.OPENLEE_SECRET } }),
    axios.post(`http://localhost:${PORT}/api/ollama`,   { prompt },                    { headers: { 'x-openlee-key': process.env.OPENLEE_SECRET } }),
  ].map(p => p.catch(err => ({ data: { text: '', error: err.message, provider: 'unknown' } })));

  const results = await Promise.all(calls);
  res.json({
    prompt,
    responses: results.map(r => r.data),
    timestamp: new Date().toISOString()
  });
});

// ─── BUDDYSYSTEM RELAY (UE5 NPC dialogue) ─────────────────────────────────────
// UE5 calls this instead of Claude directly — keeps API key off client machine
app.post('/api/buddy', requireAuth, async (req, res) => {
  const { system, messages, npc_id, max_tokens = 180 } = req.body;

  if (!npc_id) return res.status(400).json({ error: 'npc_id required' });
  if (!messages) return res.status(400).json({ error: 'messages required' });

  try {
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: process.env.BUDDY_MODEL || 'claude-sonnet-4-5',
        max_tokens,
        system,
        messages
      },
      {
        headers: {
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        timeout: 8000, // tight timeout for in-game feel
      }
    );

    const dialogue = response.data?.content?.[0]?.text?.trim() || '';
    res.json({ npc_id, dialogue, success: true });

  } catch (err) {
    // Always return something — game must not freeze on API failure
    const fallback = req.body.fallback_dialogue || '...';
    res.json({ npc_id, dialogue: fallback, success: false, error: err.message });
  }
});

// ─── Error Handler ────────────────────────────────────────────────────────────
function handleProviderError(res, err, provider) {
  const status = err.response?.status;
  const message = err.response?.data?.error?.message || err.message;

  console.error(`[OPEN-LEE] ${provider} error ${status}: ${message}`);

  if (status === 429) return res.status(429).json({ error: 'rate_limited', provider, message });
  if (status === 401) return res.status(401).json({ error: 'auth_failed', provider, message });
  if (status === 400) return res.status(400).json({ error: 'bad_request', provider, message });

  res.status(500).json({ error: 'provider_error', provider, message, status });
}

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, '127.0.0.1', () => {
  console.log(`OPEN-LEE proxy running on http://127.0.0.1:${PORT}`);
  console.log('Routes: /api/claude | /api/openai | /api/mistral | /api/grok | /api/ollama | /api/all | /api/buddy');
});
