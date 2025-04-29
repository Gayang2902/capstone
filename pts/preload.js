const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    sendRequest: (jsonReq) => ipcRenderer.invoke('ipc-request', jsonReq)
});
