// /Users/baki/Desktop/capstone_2/capstone/frontend/src/ipc/utilHandlers.js
const { clipboard } = require('electron');

function registerUtilHandlers(ipcMain, mainWindow) {

  ipcMain.on('navigate', (_evt, page) => {
    if (!mainWindow) return;
    mainWindow.webContents.send('renderer:navigate', page);
  });

  ipcMain.on('prevent-screenshot', () => {
    mainWindow.setContentProtection(true);
  });

  ipcMain.on('allow-screenshot', () => {
    mainWindow.setContentProtection(false);
  });

  ipcMain.on('user-active', () => {
    // Placeholder for user activity tracking
  });

  ipcMain.on('clear-browser-storage', async () => {
    try {
        await mainWindow.webContents.session.clearStorageData({
            storages: [
                'appcache',
                'cookies',
                'filesystem',
                'indexdb',
                'shadercache',
                'websql',
                'serviceworkers',
                'cachestorage',
            ],
        });
        await mainWindow.webContents.session.clearCache();
    } catch (err) {
        console.error('Storage clear error:', err);
    }
  });

  ipcMain.handle('writeClipboard', async (_evt, text) => {
    clipboard.writeText(text);
    setTimeout(() => {
        // 30초 후 클립보드에 여전히 해당 텍스트가 있을 경우에만 지웁니다.
        if (clipboard.readText() === text) {
            clipboard.clear();
        }
    }, 30000);
    return { status: true };
  });
}

module.exports = { registerUtilHandlers };
