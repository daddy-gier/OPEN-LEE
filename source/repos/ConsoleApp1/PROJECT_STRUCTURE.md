# OPEN-LEE Project Structure & Setup Guide

## Full Directory Tree

```
OPEN-LEE/
│
├── 📄 README.md                    # Main documentation (START HERE)
├── 📄 GETTING_STARTED.md          # Installation & first run guide
├── 📄 ARCHITECTURE.md             # Technical design deep dive
├── 📄 API_REFERENCE.md            # All API endpoints
├── 📄 GIT_INSTRUCTIONS.md         # How to push to GitHub
├── 📄 LICENSE                     # MIT License
├── 📄 .gitignore                  # Git ignore rules
│
├── 📁 server/                      # Express proxy server (Node.js)
│   ├── index.js                    # Main server file
│   ├── package.json                # Dependencies
│   ├── .env.example                # Environment template
│   └── node_modules/               # (after npm install)
│
├── 📁 web/                         # React frontend
│   ├── src/
│   │   ├── OpenLeeArtifact.jsx    # Main component (all 4 fixes applied)
│   │   ├── api.ts                  # API wrapper functions
│   │   ├── main.jsx                # Vite entry point
│   │   └── index.css               # Styles (if needed)
│   ├── public/
│   │   └── vite.svg                # Logo/favicon
│   ├── package.json                # Dependencies
│   ├── vite.config.js              # Vite configuration
│   ├── tsconfig.json               # TypeScript config
│   └── node_modules/               # (after npm install)
│
└── 📁 .github/                     # GitHub configuration (optional)
    └── workflows/
        └── test.yml                # CI/CD pipeline
```

---

## What Each File Does

### Root Level

| File | Purpose |
|------|---------|
| `README.md` | Main documentation — start here |
| `GETTING_STARTED.md` | Installation walkthrough |
| `ARCHITECTURE.md` | Technical deep dive for developers |
| `API_REFERENCE.md` | Complete API endpoint docs |
| `GIT_INSTRUCTIONS.md` | How to push to GitHub |
| `LICENSE` | MIT License — use freely |
| `.gitignore` | Tells git which files to ignore (secrets, node_modules, etc.) |

### Server Folder (`server/`)

| File | Purpose |
|------|---------|
| `index.js` | Main proxy server — handles all API requests |
| `package.json` | Lists dependencies (express, dotenv, etc.) |
| `.env.example` | Template for environment variables |
| `.env` | Your actual secrets (git-ignored) |

**What the server does:**
- Stores API keys securely
- Routes prompts to the right AI model
- Applies timeouts and error handling
- Synthesizes responses
- Serves the `/api/query`, `/api/synthesize`, `/api/health` endpoints

### Web Folder (`web/`)

| File | Purpose |
|------|---------|
| `src/OpenLeeArtifact.jsx` | Main React component with all 4 fixes |
| `src/api.ts` | API wrapper with TypeScript types |
| `src/main.jsx` | Vite entry point |
| `package.json` | React dependencies (vite, react, etc.) |
| `vite.config.js` | Vite build configuration |
| `tsconfig.json` | TypeScript configuration |

**What the frontend does:**
- Display the UI
- Accept user prompts
- Fire requests to the proxy server
- Show real-time progress
- Display model responses
- Show the final synthesis

---

## The 4 Production Fixes (Recap)

### FIX 1: 🔐 API Key Security
**File:** `server/index.js`
```javascript
// Keys stored server-side ONLY
const CFG = {
  ANTHROPIC_KEY: process.env.ANTHROPIC_API_KEY,  // Never exposed to client
  ...
};
```

### FIX 2: ⏱️ Timeout + Abort
**File:** `web/src/OpenLeeArtifact.jsx`
```javascript
// AbortController on every fetch
const controller = new AbortController();
const timer = setTimeout(() => controller.abort(), 90_000);
const res = await fetch(url, { signal: controller.signal });
```

### FIX 3: 📘 Full TypeScript
**File:** `web/src/api.ts` (JSX uses JSDoc)
```typescript
/**
 * @param {string} prompt
 * @returns {Promise<string>}
 */
async function callClaude(prompt) { ... }
```

### FIX 4: ⚡ Memoization
**File:** `web/src/OpenLeeArtifact.jsx`
```javascript
const MemoLoadingDots = React.memo(LoadingDots);
const progress = useMemo(() => (doneCt / MODELS.length) * 100, [doneCt]);
```

---

## Quick Start Checklist

- [ ] Clone the repo: `git clone https://github.com/YOUR_USERNAME/OPEN-LEE.git`
- [ ] `cd OPEN-LEE`
- [ ] Install server: `cd server && npm install`
- [ ] Install web: `cd ../web && npm install`
- [ ] Create `.env` in `server/` with your API keys
- [ ] Start server: `cd server && npm start`
- [ ] Start web: `cd ../web && npm start`
- [ ] Open `http://localhost:5173` in browser
- [ ] Test with a query
- [ ] Push to GitHub (follow `GIT_INSTRUCTIONS.md`)

---

## Development Workflow

### Making Changes to Frontend

```bash
cd web
# Edit OpenLeeArtifact.jsx
# Vite hot-reloads automatically
npm run build  # When ready to ship
```

### Making Changes to Backend

```bash
cd server
# Edit index.js
# Restart npm start to see changes
npm start
```

### Testing Everything

```bash
# Terminal 1: Server
cd server && npm start

# Terminal 2: Frontend
cd web && npm start

# Terminal 3: Curl test (optional)
curl http://localhost:3001/api/health
```

---

## Deployment Paths

### Option 1: Vercel (Frontend) + Railway (Backend)
**Easiest for beginners**
1. Push to GitHub
2. Vercel auto-deploys `web/` folder
3. Railway auto-deploys `server/` folder
4. Update frontend to point to Railway backend

### Option 2: Self-Hosted on Your Machine
**Easiest for local use**
1. Run `npm start` in both folders
2. Access at `localhost:5173` and `localhost:3001`
3. Keep both running as background services

### Option 3: Docker (Production)
**Most professional**
```bash
docker build -t open-lee .
docker run -p 3001:3001 -e ANTHROPIC_API_KEY=... open-lee
```

---

## File Sizes & Performance

| Component | Size | Type |
|-----------|------|------|
| `web/src/OpenLeeArtifact.jsx` | ~12 KB | JSX |
| `server/index.js` | ~8 KB | JavaScript |
| Bundled React app | ~150 KB | gzipped |
| Proxy server | ~25 MB | with node_modules |

---

## Security Notes

### ✅ DO
- Store API keys in `.env` files
- Git-ignore `.env` files (never commit secrets)
- Use HTTPS in production
- Validate user inputs on backend

### ❌ DON'T
- Hardcode API keys in source code
- Push `.env` to GitHub
- Expose credentials in browser console
- Use outdated packages

---

## Updating Dependencies

```bash
# Check for outdated packages
npm outdated

# Update all dependencies
npm update

# Update specific package
npm install package-name@latest
```

---

## Getting Help

1. **Setup issue?** → Read `GETTING_STARTED.md`
2. **API question?** → Read `API_REFERENCE.md`
3. **Architecture confused?** → Read `ARCHITECTURE.md`
4. **Git problem?** → Read `GIT_INSTRUCTIONS.md`
5. **Still stuck?** → Open a GitHub Issue

---

## Next Steps

1. ✅ Read this file
2. ✅ Read `GETTING_STARTED.md`
3. ✅ Run local setup
4. ✅ Test with a query
5. ✅ Follow `GIT_INSTRUCTIONS.md` to push to GitHub
6. ✅ Share the link!

---

**Happy coding! 🚀 — OPEN-LEE v3.1**
