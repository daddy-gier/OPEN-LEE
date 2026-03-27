# ============================================================
#  OZARK-01 / FRANKENSTINE — Ollama + OpenClaw Setup Script
#  Machine : DESKTOP-EJ1NQF3  |  GPU: 18 GB VRAM total
#  Run from PowerShell (no admin required)
# ============================================================

$OZARK_DIR   = "Z:\Gierl\OZARK-01"
$LOG_FILE    = "$OZARK_DIR\ollama_setup_log.txt"
$CONFIG_FILE = "$OZARK_DIR\ollama_openclaw_config.json"
$OLLAMA_URL  = "http://localhost:11434"

# Ensure OZARK-01 directory exists
if (!(Test-Path $OZARK_DIR)) {
    New-Item -ItemType Directory -Path $OZARK_DIR -Force | Out-Null
}

function Log {
    param([string]$msg, [string]$color = "White")
    $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $line = "[$ts] $msg"
    Write-Host $line -ForegroundColor $color
    Add-Content -Path $LOG_FILE -Value $line
}

function LogSection {
    param([string]$title)
    $sep = "=" * 60
    Write-Host "`n$sep" -ForegroundColor Cyan
    Write-Host "  $title" -ForegroundColor Cyan
    Write-Host "$sep" -ForegroundColor Cyan
    Add-Content -Path $LOG_FILE -Value "`n$sep`n  $title`n$sep"
}

# ── Header ──────────────────────────────────────────────────
Add-Content -Path $LOG_FILE -Value "`n`n$("="*60)"
Add-Content -Path $LOG_FILE -Value "  OZARK-01 Setup Run — $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Add-Content -Path $LOG_FILE -Value "$("="*60)"
Write-Host ""
Write-Host "  OZARK-01 / FRANKENSTINE — Ollama OpenClaw Setup" -ForegroundColor Cyan
Write-Host "  Log: $LOG_FILE" -ForegroundColor Gray
Write-Host ""

# ============================================================
#  STEP 1 — Verify Ollama is running
# ============================================================
LogSection "STEP 1 — Verify Ollama"

$ollamaRunning = $false
try {
    $resp = Invoke-WebRequest -Uri "$OLLAMA_URL" -TimeoutSec 3 -ErrorAction Stop
    Log "Ollama is already running at $OLLAMA_URL" "Green"
    $ollamaRunning = $true
} catch {
    Log "Ollama not responding — attempting to start..." "Yellow"
    Start-Process -FilePath "ollama" -ArgumentList "serve" -WindowStyle Hidden
    Start-Sleep -Seconds 5
    try {
        Invoke-WebRequest -Uri "$OLLAMA_URL" -TimeoutSec 5 -ErrorAction Stop | Out-Null
        Log "Ollama started successfully" "Green"
        $ollamaRunning = $true
    } catch {
        Log "ERROR: Could not start Ollama. Is it installed? Run: winget install Ollama.Ollama" "Red"
        Log "Continuing anyway — pull commands will handle startup." "Yellow"
    }
}

# Show current model list
Log "Current models installed:" "Cyan"
try {
    $listOutput = & ollama list 2>&1
    $listOutput | ForEach-Object { Log "  $_" "Gray" }
} catch {
    Log "  (could not query ollama list)" "Yellow"
}

# ============================================================
#  STEP 2 — Pull recommended models (18 GB VRAM budget)
# ============================================================
LogSection "STEP 2 — Pull Models"

# Check VRAM before pulling
Log "VRAM check before pulls:" "Cyan"
try {
    $vramBefore = & nvidia-smi --query-gpu=memory.used,memory.free,memory.total --format=csv,noheader 2>&1
    $vramBefore | ForEach-Object { Log "  $_" "Gray" }
} catch {
    Log "  nvidia-smi not available or no NVIDIA GPU" "Yellow"
}

$models = @(
    @{ Name = "CHARLIE"; Model = "qwen2.5-coder:14b"; EstVRAM = "9 GB" },
    @{ Name = "SCOUT";   Model = "qwen3:14b";          EstVRAM = "9 GB" },
    @{ Name = "SPEEDY";  Model = "mistral:7b";          EstVRAM = "5 GB" }
)

$pulledModels   = @()
$failedModels   = @()
$totalVRAMUsed  = 0

foreach ($m in $models) {
    Log "Pulling $($m.Name) ($($m.Model), est. $($m.EstVRAM))..." "Yellow"
    try {
        & ollama pull $m.Model 2>&1 | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
        Log "$($m.Name) pulled successfully: $($m.Model)" "Green"
        $pulledModels += $m.Name

        # VRAM check after each pull
        try {
            $vram = & nvidia-smi --query-gpu=memory.used,memory.free --format=csv,noheader 2>&1
            Log "  VRAM after pull: $($vram -join ' | ')" "Gray"
        } catch {}

    } catch {
        Log "WARNING: Failed to pull $($m.Model) — $($_.Exception.Message)" "Red"
        Log "Continuing to next model..." "Yellow"
        $failedModels += $m.Name
    }
}

# ============================================================
#  STEP 3 — Test each model
# ============================================================
LogSection "STEP 3 — Model Tests"

$testPrompts = @{
    "qwen2.5-coder:14b" = "Write a one-line UE5 C++ comment for a faction reputation function"
    "qwen3:14b"          = "What is the role of a DossierSubsystem in a prison RPG?"
    "mistral:7b"         = "Summarize what a dual currency system is in 2 sentences"
}

foreach ($m in $models) {
    if ($m.Name -in $failedModels) {
        Log "Skipping test for $($m.Name) (pull failed)" "Yellow"
        continue
    }
    Log "Testing $($m.Name) ($($m.Model))..." "Cyan"
    try {
        $prompt  = $testPrompts[$m.Model]
        $result  = & ollama run $m.Model $prompt 2>&1
        $preview = ($result | Out-String).Trim().Substring(0, [Math]::Min(120, ($result | Out-String).Trim().Length))
        Log "  Response: $preview..." "Gray"
        Log "  $($m.Name) TEST PASSED" "Green"
    } catch {
        Log "  $($m.Name) TEST FAILED: $($_.Exception.Message)" "Red"
    }
}

# ============================================================
#  STEP 4 — Verify Ollama OpenAI-compatible API
# ============================================================
LogSection "STEP 4 — Verify Ollama API"

try {
    $apiResp = Invoke-RestMethod -Uri "$OLLAMA_URL/v1/models" -Method GET -TimeoutSec 10
    Log "Ollama OpenAI API is LIVE at $OLLAMA_URL/v1/models" "Green"
    $apiResp.data | ForEach-Object { Log "  Model available: $($_.id)" "Gray" }
} catch {
    Log "WARNING: Ollama API check failed — $($_.Exception.Message)" "Red"
    Log "  Make sure Ollama is running: ollama serve" "Yellow"
}

# Also show nvidia-smi summary
Log "Final VRAM state:" "Cyan"
try {
    $vramFinal = & nvidia-smi 2>&1
    $vramFinal | Select-Object -First 20 | ForEach-Object { Log "  $_" "Gray" }
} catch {
    Log "  (nvidia-smi unavailable)" "Yellow"
}

# ============================================================
#  STEP 5 — Write ollama_openclaw_config.json
# ============================================================
LogSection "STEP 5 — Write OpenClaw Config"

$config = @{
    cluster          = "OZARK-01"
    node             = "FRANKENSTINE"
    hostname         = $env:COMPUTERNAME
    gpu_vram_total_gb = 18
    ollama_base_url  = $OLLAMA_URL
    updated          = (Get-Date -Format "yyyy-MM-dd")

    brain = @{
        provider    = "anthropic"
        model       = "claude-sonnet-4-6"
        role        = "orchestrator"
        description = "Makes decisions, delegates tasks, reviews output"
    }

    muscles = @(
        @{
            name     = "CHARLIE"
            provider = "ollama"
            model    = "qwen2.5-coder:14b"
            base_url = "$OLLAMA_URL/v1"
            role     = "coder"
            tasks    = @("C++ code generation", "UE5 Blueprint logic", "BuddySystem NPC dialogue code")
        },
        @{
            name     = "SCOUT"
            provider = "ollama"
            model    = "qwen3:14b"
            base_url = "$OLLAMA_URL/v1"
            role     = "researcher"
            tasks    = @("NPC dossier generation", "Faction profile writing", "Game design research")
        },
        @{
            name     = "SPEEDY"
            provider = "ollama"
            model    = "mistral:7b"
            base_url = "$OLLAMA_URL/v1"
            role     = "fast_tasks"
            tasks    = @("Quick summaries", "Memory routing", "Short text generation")
        }
    )

    server_endpoint = "http://localhost:3001"
    openclaw_routes = @{
        status  = "GET  /api/openclaw/status"
        charlie = "POST /api/openclaw/charlie"
        scout   = "POST /api/openclaw/scout"
        speedy  = "POST /api/openclaw/speedy"
        brain   = "POST /api/openclaw/brain"
    }

    pulled_successfully = $pulledModels
    pull_failed         = $failedModels
}

$config | ConvertTo-Json -Depth 10 | Set-Content -Path $CONFIG_FILE -Encoding UTF8
Log "Config written to: $CONFIG_FILE" "Green"

# ============================================================
#  STEP 6 — .env update hint for OpenClaw Steve
# ============================================================
LogSection "STEP 6 — OpenClaw Steve .env Reminder"

$envHint = @"

# ── OpenClaw Muscle Config (add to server\.env) ────────────
OLLAMA_BASE_URL=http://localhost:11434/v1
OLLAMA_API_KEY=ollama

OPENCLAW_CHARLIE_MODEL=qwen2.5-coder:14b
OPENCLAW_SCOUT_MODEL=qwen3:14b
OPENCLAW_SPEEDY_MODEL=mistral:7b
# ────────────────────────────────────────────────────────────
"@

Log "Add these lines to your server\.env file:" "Cyan"
Write-Host $envHint -ForegroundColor Yellow
Add-Content -Path $LOG_FILE -Value $envHint

# ============================================================
#  STEP 7 — Summary Report
# ============================================================
LogSection "STEP 7 — Summary Report"

Log "Models pulled successfully : $($pulledModels -join ', ')" "Green"
if ($failedModels.Count -gt 0) {
    Log "Models failed             : $($failedModels -join ', ')" "Red"
}
Log "Config file location       : $CONFIG_FILE" "Cyan"
Log "Log file location          : $LOG_FILE" "Cyan"
Log "Server muscle endpoints    : http://localhost:3001/api/openclaw/*" "Cyan"
Log ""
Log "Done. FRANKENSTINE is ready for OpenClaw Brain/Muscles operation." "Green"

Write-Host ""
Write-Host "  Next: start server with  cd server && node index.js" -ForegroundColor Cyan
Write-Host "  Then test:               curl http://localhost:3001/api/openclaw/status" -ForegroundColor Cyan
Write-Host ""
