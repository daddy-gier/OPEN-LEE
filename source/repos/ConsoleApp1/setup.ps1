# OPEN-LEE Setup Script for Windows
# Run this from PowerShell (Admin not required, but recommended)

# Stop on any error
$ErrorActionPreference = "Stop"

Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  OPEN-LEE v3.1 — Windows Setup Script" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
Write-Host "✓ Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "  Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "  ERROR: Node.js not found!" -ForegroundColor Red
    Write-Host "  Please install from: https://nodejs.org (v18 or later)" -ForegroundColor Yellow
    exit 1
}

# Check if npm is installed
Write-Host "✓ Checking npm..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version
    Write-Host "  npm found: v$npmVersion" -ForegroundColor Green
} catch {
    Write-Host "  ERROR: npm not found!" -ForegroundColor Red
    exit 1
}

# Check if Git is installed
Write-Host "✓ Checking Git..." -ForegroundColor Yellow
try {
    $gitVersion = git --version
    Write-Host "  Git found: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "  WARNING: Git not found (optional)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "────────────────────────────────────────────────────────────" -ForegroundColor Cyan
Write-Host "Setting up server dependencies..." -ForegroundColor Cyan
Write-Host "────────────────────────────────────────────────────────────" -ForegroundColor Cyan
cd server
Write-Host "Installing npm packages in: $(pwd)" -ForegroundColor Yellow
npm install
Write-Host "✓ Server dependencies installed!" -ForegroundColor Green
cd ..

Write-Host ""
Write-Host "────────────────────────────────────────────────────────────" -ForegroundColor Cyan
Write-Host "Setting up web dependencies..." -ForegroundColor Cyan
Write-Host "────────────────────────────────────────────────────────────" -ForegroundColor Cyan
cd web
Write-Host "Installing npm packages in: $(pwd)" -ForegroundColor Yellow
npm install
Write-Host "✓ Web dependencies installed!" -ForegroundColor Green
cd ..

Write-Host ""
Write-Host "────────────────────────────────────────────────────────────" -ForegroundColor Cyan
Write-Host "Creating environment files..." -ForegroundColor Cyan
Write-Host "────────────────────────────────────────────────────────────" -ForegroundColor Cyan

if (!(Test-Path "server\.env")) {
    Write-Host "Creating server/.env template..." -ForegroundColor Yellow
    $envContent = @"
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
"@
    Set-Content -Path "server\.env" -Value $envContent
    Write-Host "✓ Created server/.env (add your API keys!)" -ForegroundColor Green
} else {
    Write-Host "ℹ server/.env already exists (skipping)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  ✓ Setup Complete!" -ForegroundColor Green
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Edit your API keys:" -ForegroundColor Yellow
Write-Host "   notepad server\.env" -ForegroundColor White
Write-Host ""
Write-Host "2. (Optional) Start Ollama for free models:" -ForegroundColor Yellow
Write-Host "   ollama serve" -ForegroundColor White
Write-Host ""
Write-Host "3. Start the proxy server (Terminal 1):" -ForegroundColor Yellow
Write-Host "   cd server && npm start" -ForegroundColor White
Write-Host ""
Write-Host "4. Start the React app (Terminal 2):" -ForegroundColor Yellow
Write-Host "   cd web && npm start" -ForegroundColor White
Write-Host ""
Write-Host "5. Open your browser:" -ForegroundColor Yellow
Write-Host "   http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "For more help, see: README.md or GETTING_STARTED.md" -ForegroundColor Cyan
