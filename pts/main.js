const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const backend = require('./backend');

function createWindow() {
    const win = new BrowserWindow({
        width: 1000,
        height: 700,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true
        }
    });

    win.loadFile('index.html');
}

app.whenReady().then(createWindow);

// IPC: 프론트에서 오는 요청을 백엔드로 전달
ipcMain.handle('ipc-request', async (event, req) => {
    const response = await backend.handleRequest(req);
    return response;
});
