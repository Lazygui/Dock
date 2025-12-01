// electron/preload.cjs

// 注意：这里使用 require，而不是 import
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
       startPing: (options) => ipcRenderer.send('start-ping', options),

       onPingReply: (callback) => {
              const listener = (_event, data) => callback(data);
              ipcRenderer.on('ping-reply', listener);
              return () => ipcRenderer.removeListener('ping-reply', listener);
       },
       minimize: () => ipcRenderer.send('window-min'),
       close: () => ipcRenderer.send('window-close')
});