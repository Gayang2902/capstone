// File: main.js

const { app, BrowserWindow, ipcMain, Menu, globalShortcut } = require('electron');
const { spawn } = require('child_process');
const path = require('path');

// Refactored IPC Handlers
const { registerFileHandlers } = require('./src/ipc/fileHandlers');
const { registerPasswordHandlers } = require('./src/ipc/passwordHandlers');
const { registerStatsHandlers } = require('./src/ipc/statsHandlers');
const { registerUtilHandlers } = require('./src/ipc/utilHandlers');


let mainWindow;
let backendProcess;
let stdoutBuffer = '';
let nextReqId = 1;
const pending = {};

// --- State Management ---
// Shared state that was previously global in main.js
const sharedState = {
    recentFiles: [],
    currentFilePath: '',
};

const context = {
    getFilePath: () => sharedState.currentFilePath,
    setFilePath: (path) => { sharedState.currentFilePath = path; },
    getRecentFiles: () => sharedState.recentFiles,
    addRecentFile: (filePath) => {
        // Avoid duplicates and keep the list manageable
        const newRecentFiles = [filePath, ...sharedState.recentFiles.filter(f => f !== filePath)];
        sharedState.recentFiles = newRecentFiles.slice(0, 10);
    },
    // The sendToBackend function will be added to the context after it's defined.
    sendToBackend: null,
};


// --- Backend Process Management ---

let backendReady = false;
let backendReadyPromise;
let backendReadyResolve;

function startBackend() {
    backendReadyPromise = new Promise(resolve => {
        backendReadyResolve = resolve;
    });

    let exePath;
    switch (process.platform) {
        case 'darwin':
            exePath = path.join(__dirname, '..', 'backend', 'build', 'mac', 'mac', 'main');
            break;
        case 'win32':
            exePath = path.join(__dirname, '..', 'backend', 'x64', 'Release', 'capstone_backend.exe');
            break;
        case 'linux':
            exePath = path.join(__dirname, '..', 'backend', 'build', 'linux', 'main');
            break;
        default:
            throw new Error(`지원하지 않는 플랫폼: ${process.platform}`);
    }

    backendProcess = spawn(exePath, [], {
        stdio: ['pipe', 'pipe', 'inherit']
    });
    backendProcess.stdout.setEncoding('utf8');

    backendReady = true;
    backendReadyResolve();

    backendProcess.stdout.on('data', chunk => {
        console.log('[DEBUG] 백엔드 → 프론트 raw stdout chunk:', JSON.stringify(chunk));

        stdoutBuffer += chunk;
        let lines = stdoutBuffer.split('\n');
        stdoutBuffer = lines.pop();

        for (let line of lines) {
            if (!line.trim()) continue;

            let msg;
            try {
                msg = JSON.parse(line);
            } catch (e) {
                console.error('Invalid JSON from backend:', line);
                continue;
            }

            const pendingKeys = Object.keys(pending).map(k => Number(k)).sort((a,b)=>a-b);
            if (pendingKeys.length > 0) {
                const targetId = pendingKeys[0];
                pending[targetId].resolve(msg);
                delete pending[targetId];
            } else {
                console.warn('[WARN] 처리할 pending 요청이 없습니다:', msg);
            }
        }
    });

    backendProcess.on('error', (err) => {
        console.error('❌ spawn error:', err);
    });

    backendProcess.on('exit', (code, signal) => {
        console.error(`백엔드 종료 (code=${code}, signal=${signal})`);
    });
}

function sendToBackend(oper, data) {
    return new Promise(async (resolve, reject) => {
        if (!backendReady) {
            try {
                await Promise.race([
                    backendReadyPromise,
                    new Promise((_, rj) =>
                        setTimeout(() => rj(new Error('백엔드 준비 타임아웃')), 10000)
                    )
                ]);
            } catch (err) {
                return reject(err);
            }
        }

        if (!backendProcess) {
            return reject(new Error('백엔드 프로세스가 실행 중이 아닙니다.'));
        }

        const id = nextReqId++;
        let timeoutHandle;

        pending[id] = {
            resolve: (payload) => {
                clearTimeout(timeoutHandle);
                resolve(payload);
            },
            reject: (err) => {
                clearTimeout(timeoutHandle);
                reject(err);
            }
        };

        const rawPayload = { oper, data };
        console.log('[DEBUG] 프론트 → 백 payload :', JSON.stringify(rawPayload));

        backendProcess.stdin.write(JSON.stringify(rawPayload) + '\n');

        timeoutHandle = setTimeout(() => {
            if (pending[id]) {
                pending[id].reject(new Error('백엔드 응답 타임아웃'));
                delete pending[id];
            }
        }, 10000);
    });
}
// Add the function to the context so handlers can use it
context.sendToBackend = sendToBackend;


// --- Main Window Creation ---

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

    const devServerUrl = process.env.VITE_DEV_SERVER_URL;
    if (devServerUrl) {
        mainWindow.loadURL(devServerUrl);
    } else {
        const distPath = path.join(__dirname, 'dist', 'index.html');
        mainWindow.loadFile(distPath);
    }
}


// --- App Lifecycle ---

app.whenReady().then(() => {
    const template = [
        { role: 'editMenu' },
        { role: 'viewMenu', visible: false },
        { role: 'windowMenu', visible: false },
        { role: 'help', visible: false }
    ];
    Menu.setApplicationMenu(Menu.buildFromTemplate(template));

    startBackend();
    createMainWindow();

    // Register all IPC handlers from the refactored modules
    registerFileHandlers(ipcMain, mainWindow, context, app);
    registerPasswordHandlers(ipcMain, context);
    registerStatsHandlers(ipcMain, context);
    registerUtilHandlers(ipcMain, mainWindow);


    globalShortcut.register('CommandOrControl+Q', () => {
        app.quit();
    });

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
    });
});

app.on('will-quit', () => {
    globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        if (backendProcess) backendProcess.kill();
        app.quit();
    }
});
