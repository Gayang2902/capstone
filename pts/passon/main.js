// main.js
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

app.disableHardwareAcceleration();

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    transparent: true,
    frame: false,
    vibrancy: 'acrylic',
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.loadFile('index.html');

  ipcMain.on('window-minimize',  () => win.minimize());
  ipcMain.on('window-maximize',  () => win.isMaximized() ? win.unmaximize() : win.maximize());
  ipcMain.on('window-close',     () => win.close());
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
