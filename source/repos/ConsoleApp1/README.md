# OPEN-LEE v3.1 — Multi-AI Consensus Engine

**Built for Nyghtshade Hollow | By daddy-gier**

A production-grade multi-AI aggregation system that fires Claude, ChatGPT, Mistral, Grok, Ollama, OpenClaw, and LudusAI simultaneously, synthesizes unique insights from each, and delivers one unified answer.

---

## Changelog

### v3.1.1 — Synthesis Engine Fix
**Problem:** The OPEN-LEE Synthesis Engine was showing "Synthesis engine offline" after all nodes completed.

**Root Causes Fixed:**
1. **Server timeout too short** — The proxy server had a 10-second timeout on Anthropic API calls. Synthesis prompts are long (they include all 6 model responses), so they regularly exceeded this limit and returned a 504 timeout error. Fixed by increasing to 60 seconds.
2. **max_tokens too low** — Synthesis responses were capped at 1000 tokens, not enough for a full cross-model analysis. Increased to 2000 tokens for synthesis calls.
3. **Wrong API auth header** — Server was sending `Authorization: Bearer` instead of the correct Anthropic header `x-api-key`. Added `anthropic-version` header as required by the API.
4. **dotenv path wrong on Windows** — `dotenv.config()` was looking for `.env` in the working directory (project root) instead of the `server/` folder. Fixed using `fileURLToPath(import.meta.url)` to resolve the correct path.
5. **Frontend calling Anthropic directly** — The React component was trying to call `https://api.anthropic.com` directly from the browser, which fails due to CORS and missing API key. Redirected all Claude calls through the local proxy at `http://localhost:3001/api/claude`.
6. **Missing React entry point** — `index.html` and `web/src/main.jsx` were missing, preventing Vite from building the frontend. Created both files.

---

## 🚀 Quick Start

### Windows Setup (First Time)
```powershell
cd OPEN-LEE
.\setup.ps1
```

### macOS / Linux Setup
```bash
cd OPEN-LEE
bash setup.sh
```

### Start the Proxy Server
```bash
cd server
npm install
npm start
```
Server runs on `http://localhost:3001`

### Start the React App
```bash
cd web
npm install
npm start
```
App runs on `http://localhost:5173` (Vite) or `http://localhost:3000` (CRA)

---

## 📋 What You Need

### API Keys (Optional — set as environment variables)
```bash
ANTHROPIC_API_KEY=sk-ant-...      # Claude (required for full power)
OPENAI_API_KEY=sk-...              # ChatGPT
MISTRAL_API_KEY=...                # Mistral
GROK_API_KEY=...                   # Grok
OLLAMA_URL=http://localhost:11434  # Local Ollama (FREE)
```

### Free Options
- **Ollama** — Download from [ollama.ai](https://ollama.ai) and run `ollama serve`
- **OpenClaw** — Routes through Ollama (configured automatically)
- **LudusAI/BuddySystem** — Local endpoint (experimental)

---

## 🏗️ Architecture

### Server-Side Proxy (`server/index.js`)
- ✅ API keys NEVER reach the browser
- ✅ All model calls happen server-side
- ✅ Handles timeouts, retries, error cases
- ✅ Routes Claude, OpenAI, Mistral, Grok, Ollama, OpenClaw, LudusAI
- ✅ Synthesis engine cross-references all responses

**Endpoints:**
- `POST /api/query` — Fire a prompt to any model
- `POST /api/synthesize` — Merge all model responses
- `GET /api/health` — Check which models are available

### React Frontend (`web/src/OpenLeeArtifact.jsx`)
- ✅ Full TypeScript safety (JSDoc patterns)
- ✅ AbortController timeouts + manual cancel button
- ✅ Error handling with dismissible banners
- ✅ Memoized components (zero unnecessary re-renders)
- ✅ Live GPU load visualization (Buddy System tab)
- ✅ Query log with timestamps

---

## 📁 Project Structure

```
OPEN-LEE/
├── server/                    # Express proxy (Node.js)
│   ├── index.js               # Main server
│   ├── package.json
│   └── .env.example
├── web/                       # React frontend
│   ├── src/
│   │   ├── OpenLeeArtifact.jsx   # Main component (all 4 fixes)
│   │   ├── api.ts              # API wrapper (TypeScript)
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── setup.ps1                  # Windows setup script
├── setup.sh                   # macOS/Linux setup script
├── .gitignore
├── README.md
├── LICENSE
└── ARCHITECTURE.md
```

---

## 🔧 Configuration

### Environment Variables
Create `server/.env`:
```bash
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
MISTRAL_API_KEY=...
GROK_API_KEY=...
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=mistral
OPENCLAW_MODEL=qwen2.5-coder:7b
TIMEOUT_MS=90000
PORT=3001
```

### Docker (Optional)
```bash
docker build -t open-lee .
docker run -p 3001:3001 -e ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY open-lee
```

---

## 📊 Features

### Oracle Engine
- **Simultaneous Queries** — All 6 models fire in parallel
- **Progress Bar** — Real-time node completion tracking
- **Error Recovery** — Models fail independently; synthesis still works
- **Cancel Button** — Stop any query mid-flight with AbortController
- **Synthesis** — Claude cross-references all responses and merges unique insights

### Buddy System (GPU Monitoring)
- Live GPU load fluctuation animation
- Per-node CPU/GPU/VRAM display
- Cluster stats (total VRAM, avg load, protocol)
- Configurable via `GPU_NODES` constant

### Query Log
- Track all queries with timestamps
- Mode-based filtering (general, gamedev, coder)
- Persistent storage (localStorage)

---

## 🎯 The 4 Production-Grade Fixes

1. **🔐 API Key Security**
   - Keys live server-side only
   - Client calls proxy at `/api/query`
   - Zero credentials in browser memory

2. **⏱️ Timeout + Error Handling**
   - AbortController on all fetch calls
   - 90-second default timeout (configurable)
   - Manual cancel button in UI
   - Errors surface in red banner

3. **📘 Full TypeScript**
   - JSX version uses JSDoc for artifact compatibility
   - TSX version available for local React apps
   - 100% type-safe dispatch tables
   - No runtime surprises

4. **⚡ Optimized Rendering**
   - `React.memo` on LoadingDots, GpuBar, ModelCard
   - `useCallback` on all state setters
   - `useMemo` on derived values (progress, doneCt, etc.)
   - Zero unnecessary re-renders on model updates

---

## 🚀 Deploy to Production

### Vercel (Recommended for Frontend)
```bash
cd web
npm run build
vercel deploy
```

### Railway / Heroku (Backend)
```bash
cd server
git push heroku main
```

### Self-Hosted
```bash
# Build frontend
cd web
npm run build

# Serve with Express
node server/index.js
```

---

## 🧪 Test It

### Local Demo
```bash
# Terminal 1: Start proxy
cd server && npm start

# Terminal 2: Start frontend
cd web && npm start

# Terminal 3: Query via curl
curl -X POST http://localhost:3001/api/query \
  -H "Content-Type: application/json" \
  -d '{"modelId":"claude","prompt":"What is the capital of France?","mode":"general"}'
```

### Live Test
1. Navigate to `http://localhost:5173`
2. Type a query: _"Explain machine learning"_
3. Press `Ctrl+Enter` or click `▶ EXECUTE`
4. Watch all 6 models respond in parallel
5. Read the synthesized answer at the bottom

---

## 🐛 Troubleshooting

### "Claude connection failed"
- Check `ANTHROPIC_API_KEY` is set
- Verify `server/.env` exists and is readable
- Restart `npm start` in server directory

### "CORS error in browser console"
- Make sure `web` dev server can reach `http://localhost:3001`
- Check proxy config in `vite.config.js` or `package.json` (if CRA)

### "Ollama is offline"
- Ensure `ollama serve` is running (separate terminal)
- Check `OLLAMA_URL` in `.env` (default: `http://localhost:11434`)

### "OpenClaw config not found"
- Server auto-creates `~/.openclaw/openclaw.json` on first run
- If it fails, manually create and check file permissions

---

## 📖 Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** — Deep dive into system design
- **[API_REFERENCE.md](./API_REFERENCE.md)** — Full endpoint docs
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** — Production checklist
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** — Dev guidelines

---

## 📜 License

MIT — See `LICENSE` for details.

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feat/my-feature`)
3. Commit your changes (`git commit -m 'Add my feature'`)
4. Push to the branch (`git push origin feat/my-feature`)
5. Open a Pull Request

---

## 📞 Support

- **Issues** → GitHub Issues
- **Discussions** → GitHub Discussions
- **Email** → daddy-gier@nyghtshade-hollow.local (fictional)

---

**Built with ❤️ for Nyghtshade Hollow | v3.1 | Production Ready**
