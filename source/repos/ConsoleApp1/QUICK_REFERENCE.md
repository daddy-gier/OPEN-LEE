# ⚡ OPEN-LEE Quick Start Cheatsheet

## One-Minute Setup

```bash
# 1. Clone (if from GitHub)
git clone https://github.com/YOUR_USERNAME/OPEN-LEE.git && cd OPEN-LEE

# 2. Install (Windows)
.\setup.ps1

# 2. Install (macOS/Linux)
bash setup.sh

# 3. Add API key
nano server/.env  # or notepad server\.env on Windows

# 4. Start server (Terminal 1)
cd server && npm start

# 5. Start frontend (Terminal 2)
cd web && npm start

# 6. Open browser
http://localhost:5173
```

---

## File Structure at a Glance

```
OPEN-LEE/
├── README.md ........................ Start here
├── GETTING_STARTED.md .............. Installation guide
├── ARCHITECTURE.md ................. Technical deep dive
├── API_REFERENCE.md ................ Endpoint docs
├── DEPLOYMENT_CHECKLIST.md ......... Before going live
├── GIT_INSTRUCTIONS.md ............. Push to GitHub
├── PROJECT_STRUCTURE.md ............ File-by-file breakdown
├── setup.ps1 ....................... Windows installer
├── setup.sh ........................ macOS/Linux installer
├── LICENSE ......................... MIT License
├── .gitignore ...................... Git config
├── server/
│   ├── index.js ................... Proxy server (Express)
│   ├── package.json ............... Backend deps
│   └── .env ....................... Secrets (NEVER commit)
└── web/
    ├── src/
    │   ├── OpenLeeArtifact.jsx .... Main component
    │   ├── api.ts ................. API wrapper
    │   └── main.jsx ............... Entry point
    ├── package.json ............... Frontend deps
    └── vite.config.js ............. Build config
```

---

## The 4 Big Fixes

| # | Fix | File | What It Does |
|---|-----|------|--------------|
| 1 | 🔐 Security | `server/index.js` | Keys server-side only |
| 2 | ⏱️ Timeout | `web/src/OpenLeeArtifact.jsx` | AbortController + cancel button |
| 3 | 📘 Types | `web/src/api.ts` | JSDoc + TypeScript safety |
| 4 | ⚡ Speed | `web/src/OpenLeeArtifact.jsx` | React.memo + useCallback + useMemo |

---

## Environment Variables

**Create `server/.env`:**
```bash
ANTHROPIC_API_KEY=sk-ant-...           # Claude (required)
OPENAI_API_KEY=sk-...                  # ChatGPT (optional)
MISTRAL_API_KEY=...                    # Mistral (optional)
GROK_API_KEY=...                       # Grok (optional)
OLLAMA_URL=http://localhost:11434      # Local models (FREE)
PORT=3001
TIMEOUT_MS=90000
```

---

## Common Commands

```bash
# Install dependencies
npm install

# Start dev server
npm start

# Build for production
npm run build

# Check health
curl http://localhost:3001/api/health

# Query a model
curl -X POST http://localhost:3001/api/query \
  -H "Content-Type: application/json" \
  -d '{"modelId":"claude","prompt":"Hello"}'

# Git workflow
git add .
git commit -m "My changes"
git push origin main
```

---

## Troubleshooting (5-Minute Fixes)

| Problem | Solution |
|---------|----------|
| "Cannot find module" | `npm install` in the right folder |
| "API key not set" | Add to `server/.env` |
| "Connection refused" | Proxy not running on port 3001 |
| "CORS error" | Frontend/proxy mismatch on localhost |
| "Ollama offline" | Run `ollama serve` in separate terminal |
| "Timeout" | Increase `TIMEOUT_MS` in `.env` |

---

## API Endpoints (3 Main Routes)

```bash
# 1. Query a single model
POST http://localhost:3001/api/query
{
  "modelId": "claude",
  "prompt": "Your question",
  "mode": "general"
}

# 2. Synthesize all responses
POST http://localhost:3001/api/synthesize
{
  "prompt": "Original question",
  "responses": { /* all model responses */ }
}

# 3. Check server health
GET http://localhost:3001/api/health
```

---

## Model IDs

```
claude      → Anthropic Claude (requires API key)
chatgpt     → OpenAI ChatGPT (requires API key)
mistral     → Mistral AI (requires API key)
grok        → xAI Grok (requires API key)
ollama      → Local Ollama (FREE, run: ollama serve)
openclaw    → OpenClaw (FREE, uses Ollama)
ludus       → LudusAI (FREE, local endpoint)
```

---

## Context Modes

```
general     → Standard responses
gamedev     → UE5 C++ specialist (Nyghtshade Hollow context)
coder       → Production code focused
```

---

## Deployment Paths

```
Local Dev       → http://localhost:5173
Docker          → docker build -t open-lee . && docker run ...
Vercel (Web)    → vercel deploy (from web/ folder)
Railway (API)   → git push (auto-deploys)
Self-Hosted     → npm start in both folders + nginx reverse proxy
```

---

## Git Workflow

```bash
# First time
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/OPEN-LEE.git
git branch -M main
git push -u origin main

# After changes
git add .
git commit -m "Brief description"
git push origin main
```

---

## Performance Tips

✅ Use Vite (not CRA)  
✅ All models query in parallel  
✅ React.memo on expensive components  
✅ useCallback for event handlers  
✅ useMemo for expensive calculations  
✅ Keep node_modules out of git  

---

## Security Checklist

✅ API keys in `.env` (git-ignored)  
✅ HTTPS in production  
✅ CORS limited to your domain  
✅ Timeouts on all requests  
✅ Error messages don't leak secrets  
✅ Environment variables server-side only  

---

## Documentation Reading Order

1. `README.md` (5 min)
2. `GETTING_STARTED.md` (10 min)
3. `ARCHITECTURE.md` (20 min) — if curious
4. `API_REFERENCE.md` — when using API
5. `DEPLOYMENT_CHECKLIST.md` — before going live

---

## Quick Links

- **GitHub** — https://github.com/YOUR_USERNAME/OPEN-LEE
- **Ollama** — https://ollama.ai
- **Anthropic** — https://claude.ai
- **OpenAI** — https://openai.com
- **Node.js** — https://nodejs.org

---

## Key Numbers

| Metric | Value |
|--------|-------|
| Default timeout | 90 seconds |
| Number of models | 6 (+ 1 synthesis) |
| Frontend bundle size | ~150 KB (gzipped) |
| Server startup time | < 2 seconds |
| Query latency | ~10-30 seconds |
| Free models | Ollama, OpenClaw, LudusAI |
| Production ready | ✅ Yes |

---

## Keyboard Shortcuts

| Action | Keys |
|--------|------|
| Submit query | `Ctrl+Enter` or `Cmd+Enter` |
| Cancel query | Click **✕ CANCEL** button |
| Clear all | Click **Reset** button |

---

## Emergency Contacts

- Stuck? → Check `GETTING_STARTED.md`
- API question? → Read `API_REFERENCE.md`
- Bug? → Open GitHub Issue
- Feature request? → Open GitHub Discussion

---

**Print this page or bookmark for quick reference!** 🚀

**OPEN-LEE v3.1 | Production Grade | MIT License**
