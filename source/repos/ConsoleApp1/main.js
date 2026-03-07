const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow = null;
let serverProcess = null;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 1000,
    minWidth: 1200,
    minHeight: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      sandbox: false,
    },
  });

  // In production, load from build folder
  // In development, load from localhost
  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.webContents.on('did-fail-load', () => {
    console.log('Failed to load URL, retrying...');
    setTimeout(() => {
      if (mainWindow) {
        mainWindow.loadURL('http://localhost:5173');
      }
    }, 2000);
  });
}

function startServer() {
  console.log('[MAIN] Starting Express server...');
  serverProcess = spawn('node', [path.join(__dirname, 'server/index.js')], {
    stdio: 'inherit',
  });

  serverProcess.on('error', (err) => {
    console.error('[MAIN] Server error:', err);
  });

  serverProcess.on('exit', (code) => {
    console.log(`[MAIN] Server exited with code ${code}`);
  });
}

app.on('ready', () => {
  console.log('[MAIN] App is ready');
  createWindow();
  startServer();
});

app.on('window-all-closed', () => {
  console.log('[MAIN] All windows closed');

  if (serverProcess) {
    console.log('[MAIN] Killing server...');
    serverProcess.kill('SIGTERM');
  }

  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// IPC Handlers
ipcMain.handle('get-app-version', () => app.getVersion());
ipcMain.on('app-close', () => app.quit());

console.log('[MAIN] Electron main process ready');
