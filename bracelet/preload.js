const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  runSimulator: (action) => ipcRenderer.invoke('run-simulator', action),
  onLog: (callback) => ipcRenderer.on('simulator-log', (event, data) => callback(data)),
  onStatus: (callback) => ipcRenderer.on('simulator-status', (event, data) => callback(data))
});
