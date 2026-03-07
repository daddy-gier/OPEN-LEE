# Git Instructions for OPEN-LEE

## Step-by-Step: Push to GitHub

### 1. Create a GitHub Repository

1. Go to **github.com** and log in
2. Click **+ New Repository** (top right)
3. Name it: `OPEN-LEE`
4. Description: `Multi-AI Consensus Engine — Claude, ChatGPT, Mistral, Grok, Ollama`
5. Choose **Public** (so others can find it)
6. **Do NOT** check "Initialize with README" (we have our own)
7. Click **Create repository**

You'll get a screen like:
```
…or push an existing repository from the command line

git remote add origin https://github.com/YOUR_USERNAME/OPEN-LEE.git
git branch -M main
git push -u origin main
```

### 2. Initialize Git Locally

In your `OPEN-LEE` folder:

```bash
# Initialize git repo
git init

# Add all files
git add .

# Create first commit
git commit -m "Initial commit: OPEN-LEE v3.1 production build

- Full TypeScript component with JSDoc types
- Server-side proxy for API key security
- AbortController timeout handling
- Memoized components for performance
- Multi-AI orchestration (Claude, ChatGPT, Mistral, Grok, Ollama, OpenClaw, LudusAI)
- Synthesis engine cross-references all models
- Complete documentation and setup guides"

# Add GitHub as remote (copy from GitHub)
git remote add origin https://github.com/YOUR_USERNAME/OPEN-LEE.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### 3. Verify on GitHub

1. Go to `https://github.com/YOUR_USERNAME/OPEN-LEE`
2. You should see all your files
3. README.md will be the first thing visitors see
4. Green "Code" button is ready to download

---

## .gitignore (Prevents Secrets)

Create `.gitignore` in root:

```
# Environment variables
.env
.env.local
.env.*.local

# Dependencies
node_modules/
npm-debug.log
yarn-error.log

# Build output
dist/
build/
out/

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Logs
logs/
*.log

# Temporary
tmp/
temp/
*.tmp

# Node
.npm
package-lock.json
yarn.lock

# React
.eslintcache
```

---

## Updating After Changes

Once the repo is on GitHub, whenever you make changes:

```bash
# See what changed
git status

# Stage changes
git add .

# Commit with a message
git commit -m "Add feature: model weighting system"

# Push to GitHub
git push origin main
```

---

## Sharing the Link

Once pushed, share this:
```
https://github.com/YOUR_USERNAME/OPEN-LEE
```

Friends can:
- ⭐ Star it
- 🍴 Fork it
- Clone it: `git clone https://github.com/YOUR_USERNAME/OPEN-LEE.git`
- Open Issues
- Submit Pull Requests

---

## Making it Discoverable

Add topics to your GitHub repo:
1. Go to your repo Settings
2. Scroll to "Topics"
3. Add: `ai`, `claude`, `gpt`, `multi-ai`, `synthesis`, `aggregation`, `typescript`, `react`, `nodejs`

---

## README Badge (Optional)

Show off your project with a badge in README:

```markdown
[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18+-blue)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-purple)](https://typescriptlang.org)
[![License MIT](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)
```

---

## GitHub Pages (Host Docs)

Optional: Host documentation at `https://YOUR_USERNAME.github.io/OPEN-LEE`

```bash
# Create docs folder
mkdir docs

# Copy README to docs/index.md
cp README.md docs/index.md

# In GitHub Settings → Pages → Source: main branch /docs folder
```

---

## Continuous Integration (CI) — GitHub Actions

Create `.github/workflows/test.yml`:

```yaml
name: Test & Build

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci --prefix server
      - run: npm ci --prefix web
      - run: npm run build --prefix web
```

---

## Getting Help

- **GitHub Docs**: https://docs.github.com
- **Git Cheatsheet**: https://github.com/joshnh/Git-Commands
- **GitHub Issues**: Use the Issues tab to track bugs

---

**Ready to go live! 🚀**
