#!/bin/bash

# OPEN-LEE Setup Script for macOS & Linux
# Usage: bash setup.sh

set -e

echo "═══════════════════════════════════════════════════════════════"
echo "  OPEN-LEE v3.1 — macOS/Linux Setup Script"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Check if Node.js is installed
echo "✓ Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo "  ERROR: Node.js not found!"
    echo "  Please install from: https://nodejs.org (v18 or later)"
    exit 1
fi
NODE_VERSION=$(node --version)
echo "  Node.js found: $NODE_VERSION"

# Check if npm is installed
echo "✓ Checking npm..."
if ! command -v npm &> /dev/null; then
    echo "  ERROR: npm not found!"
    exit 1
fi
NPM_VERSION=$(npm --version)
echo "  npm found: v$NPM_VERSION"

# Check if Git is installed
echo "✓ Checking Git..."
if command -v git &> /dev/null; then
    GIT_VERSION=$(git --version)
    echo "  Git found: $GIT_VERSION"
else
    echo "  WARNING: Git not found (optional)"
fi

echo ""
echo "───────────────────────────────────────────────────────────────"
echo "Setting up server dependencies..."
echo "───────────────────────────────────────────────────────────────"
cd server
echo "Installing npm packages in: $(pwd)"
npm install
echo "✓ Server dependencies installed!"
cd ..

echo ""
echo "───────────────────────────────────────────────────────────────"
echo "Setting up root (web + Electron) dependencies..."
echo "───────────────────────────────────────────────────────────────"
echo "Installing npm packages in: $(pwd)"
npm install
echo "✓ Root dependencies installed!"

echo ""
echo "───────────────────────────────────────────────────────────────"
echo "Creating environment files..."
echo "───────────────────────────────────────────────────────────────"

if [ ! -f "server/.env" ]; then
    echo "Creating server/.env template..."
    cat > "server/.env" << 'EOF'
# Anthropic Claude (Required for full power)
ANTHROPIC_API_KEY=sk-ant-YOUR_KEY_HERE

# OpenAI ChatGPT (Optional)
OPENAI_API_KEY=sk-YOUR_KEY_HERE

# Mistral (Optional)
MISTRAL_API_KEY=YOUR_KEY_HERE

# Grok/xAI (Optional)
GROK_API_KEY=YOUR_KEY_HERE

# Ollama Local (FREE)
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=mistral

# OpenClaw (FREE - routes through Ollama)
OPENCLAW_MODEL=qwen2.5-coder:7b
OPENCLAW_PORT=18789

# Server Config
PORT=3001
TIMEOUT_MS=90000
EOF
    echo "✓ Created server/.env (add your API keys!)"
else
    echo "ℹ server/.env already exists (skipping)"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  ✓ Setup Complete!"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Next steps:"
echo ""
echo "1. Edit your API keys:"
echo "   nano server/.env"
echo ""
echo "2. (Optional) Start Ollama for free models:"
echo "   ollama serve"
echo ""
echo "3. Start the proxy server (Terminal 1):"
echo "   cd server && npm start"
echo ""
echo "4. Start the React app (Terminal 2):"
echo "   npm run dev"
echo ""
echo "5. Open your browser:"
echo "   http://localhost:5173"
echo ""
echo "For more help, see: README.md or GETTING_STARTED.md"
