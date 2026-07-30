const { contextBridge, ipcRenderer } = require('electron');

// Expose secure, limited APIs to the React renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  
  // Custom safe IPC messaging helper methods can be defined here
  send: (channel, data) => {
    const validChannels = ['toMain'];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  receive: (channel, func) => {
    const validChannels = ['fromMain'];
    if (validChannels.includes(channel)) {
      // Exclude event object to prevent exposing full IPC internals
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  }
});
