# 📋 OPEN-LEE Command Reference

## Installation

### Windows
```powershell
cd OPEN-LEE
.\setup.ps1
```

### macOS / Linux
```bash
cd OPEN-LEE
bash setup.sh
```

---

## Development

### Start Proxy Server (Terminal 1)
```bash
cd server
npm start
```

### Start React Frontend (Terminal 2)
```bash
cd web
npm start
```

### Browser
```
http://localhost:5173    (Vite)
or
http://localhost:3000    (Create React App)
```

---

## Configuration

### Edit Environment Variables
```bash
# Windows
notepad server\.env

# macOS/Linux
nano server/.env
```

### Add Your API Key
```
ANTHROPIC_API_KEY=sk-ant-YOUR_KEY_HERE
```

---

## Testing

### Check Server Health
```bash
curl http://localhost:3001/api/health
```

### Query Claude
```bash
curl -X POST http://localhost:3001/api/query \
  -H "Content-Type: application/json" \
  -d '{
    "modelId": "claude",
    "prompt": "What is AI?",
    "mode": "general"
  }'
```

### Query Any Model
```bash
# Replace "claude" with: chatgpt, mistral, grok, openclaw, ollama, ludus
curl -X POST http://localhost:3001/api/query \
  -H "Content-Type: application/json" \
  -d '{
    "modelId": "mistral",
    "prompt": "Explain machine learning",
    "mode": "coder"
  }'
```

### Synthesize Responses
```bash
curl -X POST http://localhost:3001/api/synthesize \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "What is AI?",
    "responses": {
      "claude": {
        "response": "AI is...",
        "error": null
      },
      "chatgpt": {
        "response": "Artificial intelligence refers to...",
        "error": null
      }
    },
    "mode": "general"
  }'
```

---

## Git / GitHub

### First Time Setup
```bash
git init
git add .
git commit -m "Initial commit: OPEN-LEE v3.1 production build"
git remote add origin https://github.com/YOUR_USERNAME/OPEN-LEE.git
git branch -M main
git push -u origin main
```

### After Making Changes
```bash
git status                          # See changes
git add .                          # Stage all changes
git commit -m "Description of changes"
git push origin main               # Push to GitHub
```

### Check Git Status
```bash
git status
git log --oneline
git diff
```

---

## Dependency Management

### Install Dependencies (Server)
```bash
cd server
npm install
```

### Install Dependencies (Web)
```bash
cd web
npm install
```

### Update Dependencies
```bash
npm update                         # Update all
npm install package@latest         # Update specific
npm outdated                       # See outdated packages
```

### Check for Vulnerabilities
```bash
npm audit
npm audit fix
```

---

## Building for Production

### Build Frontend
```bash
cd web
npm run build
```

Output goes to `web/dist/`

### Serve Production Build Locally
```bash
npm run preview
```

---

## Deployment

### Deploy Frontend to Vercel
```bash
cd web
npm install -g vercel
vercel login
vercel deploy --prod
```

### Deploy Backend to Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy
railway up
```

### Deploy Backend to Heroku
```bash
heroku login
heroku create open-lee-app
git push heroku main
```

---

## Troubleshooting Commands

### Check Node Version
```bash
node --version
npm --version
```

### Clear npm Cache
```bash
npm cache clean --force
```

### Reinstall Dependencies
```bash
rm -rf node_modules package-lock.json
npm install
```

### Kill Process on Port
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :3001
kill -9 <PID>
```

### Check Port in Use
```bash
# Windows
netstat -ano | findstr LISTENING

# macOS/Linux
lsof -i -P -n | grep LISTEN
```

---

## Ollama Commands

### Start Ollama
```bash
ollama serve
```

### Pull a Model
```bash
ollama pull mistral
ollama pull neural-chat
ollama pull orca-mini
```

### List Downloaded Models
```bash
ollama list
```

### Run Model Directly
```bash
ollama run mistral "What is AI?"
```

---

## Docker Commands

### Build Docker Image
```bash
docker build -t open-lee .
```

### Run Docker Container
```bash
docker run -p 3001:3001 \
  -e ANTHROPIC_API_KEY=sk-ant-... \
  open-lee
```

### Push to Docker Hub
```bash
docker login
docker tag open-lee YOUR_USERNAME/open-lee
docker push YOUR_USERNAME/open-lee
```

---

## Environment Variables

### View All Environment Variables
```bash
# Windows
set

# macOS/Linux
env
```

### Set Environment Variable Temporarily
```bash
# Windows
set ANTHROPIC_API_KEY=sk-ant-...

# macOS/Linux
export ANTHROPIC_API_KEY=sk-ant-...
```

---

## Useful Aliases

### Add to .bashrc or .zshrc
```bash
alias open-lee='cd ~/path/to/OPEN-LEE'
alias start-proxy='cd ~/path/to/OPEN-LEE/server && npm start'
alias start-web='cd ~/path/to/OPEN-LEE/web && npm start'
alias api-health='curl http://localhost:3001/api/health'
```

---

## Quick Reference

| Task | Command |
|------|---------|
| Install | `setup.ps1` or `bash setup.sh` |
| Start proxy | `cd server && npm start` |
| Start web | `cd web && npm start` |
| Test health | `curl http://localhost:3001/api/health` |
| Push to GitHub | `git push origin main` |
| Build for prod | `cd web && npm run build` |
| Deploy to Vercel | `vercel deploy --prod` |
| Check dependencies | `npm outdated` |
| Kill port 3001 | See Troubleshooting section |
| Pull Ollama model | `ollama pull mistral` |

---

## Script Arguments

### Setup Script (Windows)
```powershell
.\setup.ps1
# No arguments, runs setup automatically
```

### Setup Script (macOS/Linux)
```bash
bash setup.sh
# No arguments, runs setup automatically
```

---

## Debug Mode

### Enable Debug Logging
```bash
# Windows
set DEBUG=*

# macOS/Linux
export DEBUG=*
npm start
```

### Node Debug Mode
```bash
node --inspect server/index.js
```

Then open: `chrome://inspect`

---

## Performance Testing

### Measure Response Time
```bash
time curl http://localhost:3001/api/query \
  -d '{...}'
```

### Load Test
```bash
# Install Apache Bench
ab -n 100 -c 10 http://localhost:3001/api/health
```

---

## Backup & Restore

### Backup Project
```bash
# Create zip file
zip -r OPEN-LEE-backup.zip OPEN-LEE/

# or tar
tar -czf OPEN-LEE-backup.tar.gz OPEN-LEE/
```

### Restore Project
```bash
# From zip
unzip OPEN-LEE-backup.zip

# From tar
tar -xzf OPEN-LEE-backup.tar.gz
```

---

## Clean Up

### Remove Dependencies
```bash
rm -rf node_modules
rm package-lock.json
```

### Remove Build Output
```bash
rm -rf dist/
rm -rf build/
```

### Remove All Build Artifacts
```bash
rm -rf node_modules package-lock.json
rm -rf dist build
```

---

## Print This Page

```bash
# Save to PDF (macOS/Linux)
cat COMMANDS.md | enscript -B -p commands.pdf

# or
wc -l COMMANDS.md  # Count lines
```

---

**Save this file for quick reference! 📌**

**OPEN-LEE v3.1 | Command Reference**
