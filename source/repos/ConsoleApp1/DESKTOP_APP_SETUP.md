# 🚀 OPEN-LEE v3.1 — Desktop Application Setup

## ✅ Quick Start (3 Steps)

### Step 1: Run Setup Script
```powershell
.\setup.ps1
```

### Step 2: Start Ollama (New Terminal)
```bash
ollama serve
```

### Step 3: Launch OPEN-LEE
```powershell
npm start
```

---

## 📋 What This Does

| File | Purpose |
|------|---------|
| `main.js` | Electron "boss" — opens window & spawns server |
| `preload.js` | Secure bridge between React and Electron |
| `vite.config.js` | React dev server config (base: './') |
| `package.json` | Node scripts & dependencies |
| `.env.example` | API key template |

---

## 🔧 Development vs Production

### Development Mode (2 Terminals)
**Terminal 1 — React UI:**
```bash
npm run client
```

**Terminal 2 — Backend Server:**
```bash
npm run server
```

Then open `http://localhost:5173` in your browser.

### Production Mode (Desktop App)
```bash
npm start
```
This opens Electron window automatically connected to the full stack.

---

## 📦 Build for Distribution

### Create Windows Installer
```bash
npm run make
```

Output: `out/OPEN-LEE Setup.exe` (Ready to share!)

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env` and fill in your keys:

```bash
ANTHROPIC_API_KEY=sk-ant-...      # Claude (required for synthesis)
OPENAI_API_KEY=sk-...              # ChatGPT (optional)
MISTRAL_API_KEY=...                # Mistral (optional)
GROK_API_KEY=...                   # Grok (optional)
OLLAMA_URL=http://localhost:11434  # Local Ollama (FREE)
```

---

## ✅ Verification Checklist

- [ ] Node.js v18+ installed
- [ ] Python 3.9+ installed
- [ ] Ollama running (`ollama serve`)
- [ ] `npm install` completed
- [ ] `npm start` opens desktop window
- [ ] Typing query fires all 6 models
- [ ] Synthesis produces merged answer

---

## 🆘 Troubleshooting

### "White Screen" on Launch
→ Check vite.config.js has `base: './'`

### "Python not found"
→ Add Python to Windows PATH or run from Python folder

### "Ollama offline"
→ Start new terminal: `ollama serve`

### "Port 3001 in use"
→ Change PORT in `.env` to 3002, 3003, etc.

---

## 🎯 Next Steps

1. ✅ Run `npm start`
2. ✅ Type a query: _"Build me a UE5 NPC prison yard"_
3. ✅ Watch all 6 models respond in parallel
4. ✅ See CLAUDE synthesize the unified answer
5. ✅ Share your `.exe` with collaborators!

---

**Built with ❤️ for Nyghtshade Hollow | OPEN-LEE v3.1 | Production Ready**
