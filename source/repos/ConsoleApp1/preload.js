const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  getVersion: () => ipcRenderer.invoke('get-app-version'),
  closeApp: () => ipcRenderer.send('app-close'),
  onOllamaWarning: (callback) => ipcRenderer.on('ollama-warning', callback),
  onModelResponse: (callback) => ipcRenderer.on('model-response', callback),
});

console.log('[PRELOAD] Context bridge initialized');
