const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  getVersion: () => ipcRenderer.invoke('get-app-version'),
  closeApp: () => ipcRenderer.send('app-close'),
  onOllamaWarning: (callback) => ipcRenderer.on('ollama-warning', callback),
  onModelResponse: (callback) => ipcRenderer.on('model-response', callback),
  startSpeech: () => ipcRenderer.invoke('speech-start'),
  stopSpeech: () => ipcRenderer.send('speech-stop'),
  onSpeechResult: (callback) => ipcRenderer.on('speech-result', (_, text) => callback(text)),
  onSpeechError: (callback) => ipcRenderer.on('speech-error', (_, err) => callback(err)),
});

console.log('[PRELOAD] Context bridge initialized');
