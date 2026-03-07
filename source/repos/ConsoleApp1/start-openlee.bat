@echo off
REM OPEN-LEE Desktop App Launcher for Windows

echo.
echo ====================================
echo   OPEN-LEE v3.1 - Multi-AI Consensus
echo ====================================
echo.

echo [1/3] Checking if Ollama is running...
timeout /t 2 /nobreak

echo [2/3] Starting OPEN-LEE...
npm start

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: OPEN-LEE failed to start
    echo Make sure you ran: npm install
    pause
)
