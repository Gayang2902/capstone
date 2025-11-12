const { BrowserWindow, Menu } = require('electron');
const path = require('path');

let mainWindow;

function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 1500,
        height: 900,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
        contentProtection: true,
        autoHideMenuBar: true,
    });

    Menu.setApplicationMenu(null);

    mainWindow.webContents.on('before-input-event', (event, input) => {
        if (input.type === 'keyDown') {
            const key = input.key.toLowerCase();
            if ((input.control || input.meta) && !input.shift && key === 'r') {
                event.preventDefault();
                return;
            }
            if (
                input.key === 'F12' ||
                ((input.control || input.meta) && input.shift && key === 'i')
            ) {
                // event.preventDefault(); // Temporarily allow DevTools for debugging
            }
        }
    });

    mainWindow.loadFile(path.join(__dirname, 'pages', 'start', 'start.html'));
}

function getMainWindow() {
    return mainWindow;
}

module.exports = {
    createMainWindow,
    getMainWindow
};