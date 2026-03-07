# OPEN-LEE — Getting Started Guide

## Prerequisites

- **Node.js 18+** — [nodejs.org](https://nodejs.org)
- **npm** or **yarn** — Comes with Node.js
- **Git** — [git-scm.com](https://git-scm.com)
- **Ollama** (optional) — [ollama.ai](https://ollama.ai) for free local models

## Installation

### Step 1: Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/OPEN-LEE.git
cd OPEN-LEE
```

### Step 2: Install Dependencies

#### Proxy Server
```bash
cd server
npm install
```

#### React Frontend
```bash
cd ../web
npm install
```

### Step 3: Set Up Environment Variables

Create `server/.env`:
```bash
# Required for Claude
ANTHROPIC_API_KEY=sk-ant-YOUR_KEY_HERE

# Optional — leave blank to skip
OPENAI_API_KEY=sk-YOUR_KEY_HERE
MISTRAL_API_KEY=YOUR_KEY_HERE
GROK_API_KEY=YOUR_KEY_HERE

# Local Ollama (FREE)
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=mistral

# OpenClaw configuration
OPENCLAW_MODEL=qwen2.5-coder:7b
OPENCLAW_PORT=18789

# Server configuration
PORT=3001
TIMEOUT_MS=90000
```

### Step 4: Start Ollama (Optional but Recommended)

If you want to use free local models:

```bash
# Terminal 1
ollama serve

# Terminal 2 — pull a model (one-time)
ollama pull mistral
```

### Step 5: Start the Proxy Server

```bash
cd server
npm start
```

You should see:
```
╔══════════════════════════════════════════════╗
║ OPEN-LEE Proxy Server ║
║ http://localhost:3001 ║
║ ║
║ API keys secured server-side only ║
║ OpenClaw → Ollama (mistral) ║
║ Health: http://localhost:3001/api/health ║
╚══════════════════════════════════════════════╝
```

### Step 6: Start the React Frontend

In a new terminal:

```bash
cd web
npm start
```

For **Vite**, it will open `http://localhost:5173` automatically.
For **Create React App**, it will open `http://localhost:3000`.

---

## First Query

1. Navigate to the app in your browser
2. Type a question in the text box:
   ```
   What are the key differences between machine learning and deep learning?
   ```
3. Press `Ctrl+Enter` or click `▶ EXECUTE`
4. Watch all 6 models process in parallel
5. Read the synthesized answer at the bottom

---

## Understanding the UI

### Oracle Engine Tab
- **PROMPT INPUT** — Where you type your question
- **NODE COMPLETION** — Real-time progress bar showing which models are done
- **Model Cards** — Individual responses from each AI
  - 🟢 COMPLETE — Model finished successfully
  - 🔴 ERROR — Model failed
  - ⚪ THINKING — Model is processing
  - ⚫ STANDBY — Waiting to start
- **SYNTHESIS ENGINE** — Final merged answer combining unique insights

### Buddy System Tab
- **GPU Nodes** — Simulated hardware cluster status
- **CAPTAIN, FRANKENSTINE, NODE-03–06** — Machine names
- **CPU, GPU, VRAM, GPU UTIL** — Hardware specs and utilization
- **Cluster Stats** — Total VRAM, average load, protocol

### Query Log Tab
- **Recent Queries** — All previous prompts with timestamps
- **Clear Log** — Remove all entries (button on top right)

---

## Modes

### General (Default)
Standard AI responses with no specific context.

### Game Dev
Specialized for Unreal Engine 5 C++ development.
Models will provide UE5-specific code and patterns.

### Coder
Focused on production-ready code with error handling.

---

## Tips & Tricks

### Speed Up Responses
- Make sure `ollama serve` is running in the background
- Use `ollama pull mistral` to pre-load the model (don't wait for download during queries)
- Reduce `TIMEOUT_MS` in `.env` if you want faster failure detection

### Cancel a Query
While a query is running, click the **✕ CANCEL** button to abort it immediately.

### Check Model Status
Visit `http://localhost:3001/api/health` to see which models are available.

### Test via Curl
```bash
curl -X POST http://localhost:3001/api/query \
  -H "Content-Type: application/json" \
  -d '{
    "modelId": "claude",
    "prompt": "Hello, how are you?",
    "mode": "general"
  }'
```

---

## Troubleshooting

### Error: "ANTHROPIC_API_KEY is not set"
**Solution:** Create `server/.env` and add your key:
```bash
ANTHROPIC_API_KEY=sk-ant-...
```

### Error: "Ollama HTTP 404 — is 'ollama serve' running?"
**Solution:** 
1. Open a new terminal
2. Run `ollama serve`
3. In another terminal, run `ollama pull mistral` (one-time setup)

### Error: "CORS error" in browser console
**Solution:**
- Make sure the proxy is running on `http://localhost:3001`
- Check that `web` dev server is running
- Try hard-refreshing the browser (Ctrl+Shift+R)

### Slow responses from Claude
**Solution:**
- Check your internet connection
- Verify `ANTHROPIC_API_KEY` is valid
- Claude Sonnet-4 is slower than 3.5; use `claude-3-5-sonnet` in `server/index.js` if available

### "Cannot find module 'express'"
**Solution:**
```bash
cd server
npm install
npm start
```

---

## Next Steps

- Read **[ARCHITECTURE.md](./ARCHITECTURE.md)** for technical deep dive
- Read **[API_REFERENCE.md](./API_REFERENCE.md)** for all endpoints
- Read **[DEPLOYMENT.md](./DEPLOYMENT.md)** for production setup
- Check out the GitHub Issues to report bugs or request features

---

## Getting Help

- **Stuck?** → Check the Troubleshooting section above
- **Bug?** → Open a GitHub Issue with reproduction steps
- **Feature Request?** → Start a GitHub Discussion

---

**Happy synthesizing! 🚀**
