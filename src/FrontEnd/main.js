const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const fs = require('fs');
const path = require('path');

// ================= 앱 초기 설정 =================
const recentFilePath = path.join(app.getPath('userData'), 'recent-files.json');
let currentPasswordFilePath = null;
let currentFile = null;
let mainWindow;
let currentPage = 'start';
let isForceQuit = false;

app.on('before-quit', () => {
    isForceQuit = true;
});

// ================= 메인 윈도우 생성 =================
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1440,
        height: 900,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        }
    });

    mainWindow.loadFile(path.join(__dirname, 'pages/start/start.html')).then(()=> {currentPage = 'start';});

    mainWindow.on('close', (e) => {
        if (!isForceQuit && currentPage !== 'start') {
            e.preventDefault();
            mainWindow.loadFile(path.join(__dirname, 'pages/start/start.html')).then(() => {currentPage = 'start';});
            currentPage = 'start';
        }
    });
}

// ================= 페이지 네비게이션 =================
ipcMain.on('navigate', (event, page) => {
    const filePath = path.join(__dirname, `pages/${page}/${page}.html`);
    mainWindow.loadFile(filePath).then(() => {currentPage = 'start';});
    currentPage = page;
});

// ================= 스크린샷 제어 =================
ipcMain.on('prevent-screenshot', () => {
    if (mainWindow) mainWindow.setContentProtection(true);
});
ipcMain.on('allow-screenshot', () => {
    if (mainWindow) mainWindow.setContentProtection(false);
});

// ================= 사용자 활동 감지 =================
ipcMain.on('user-active', () => {
    // 타이머 리셋용
});

app.whenReady().then(createWindow);
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// ================= 파일 관련 핸들러 =================
function saveRecentFile(filePath) {
    let list = [];
    if (fs.existsSync(recentFilePath)) {
        list = JSON.parse(fs.readFileSync(recentFilePath, 'utf-8'));
    }
    if (!list.includes(filePath)) list.unshift(filePath);
    if (list.length > 5) list = list.slice(0, 5);
    fs.writeFileSync(recentFilePath, JSON.stringify(list));
}

function getMetaFilePath(csvFilePath) {
    const dir = path.dirname(csvFilePath);
    const nameWithoutExt = path.basename(csvFilePath, '.csv');
    return path.join(dir, `${nameWithoutExt}.meta.json`);
}

ipcMain.handle('open-file', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
        title: '파일 선택',
        filters: [{ name: 'CSV 파일', extensions: ['csv'] }],
        properties: ['openFile']
    });

    if (!canceled && filePaths.length > 0) {
        const selected = filePaths[0];
        saveRecentFile(selected);
        return selected;
    }
    return null;
});

ipcMain.handle('get-recent-files', () => {
    if (fs.existsSync(recentFilePath)) {
        return JSON.parse(fs.readFileSync(recentFilePath, 'utf-8'));
    }
    return [];
});

ipcMain.handle('create-file', async () => {
    const { filePath, canceled } = await dialog.showSaveDialog({
        title: '새 비밀번호 파일 만들기',
        defaultPath: 'passwords.csv',
        filters: [{ name: 'CSV 파일', extensions: ['csv'] }]
    });

    if (!canceled && filePath) {
        fs.writeFileSync(filePath, '');
        saveRecentFile(filePath);
        return filePath;
    }
    return null;
});

// ================= 마스터 비밀번호 관련 =================
ipcMain.handle('read-master-password', (event, filePath) => {
    try {
        const metaFile = getMetaFilePath(filePath);
        if (!fs.existsSync(metaFile)) return null;

        const data = JSON.parse(fs.readFileSync(metaFile, 'utf-8'));
        const metaFilePath = path.resolve(data.file); // 메타파일 내부에 저장된 절대경로
        const currentPath = path.resolve(filePath);   // 현재 선택한 파일 경로

        // 파일 경로가 일치하지 않으면 무시
        if (metaFilePath !== currentPath) {
            console.warn('[경고] 메타 파일과 선택한 파일 경로가 일치하지 않음');
            return null;
        }

        return data.masterPassword || null;
    } catch (err) {
        console.error('[메타 파일 읽기 실패]', err);
        return null;
    }
});

ipcMain.handle('set-master-password', (event, filePath, password) => {
    try {
        const metaFile = getMetaFilePath(filePath);
        const data = {
            file: path.resolve(filePath), // 파일 절대 경로 형식으로 저장 (2)
            masterPassword: password
        };
        fs.writeFileSync(metaFile, JSON.stringify(data, null, 2), 'utf-8');
        return true;
    } catch (err) {
        console.error('[메타 파일 저장 실패]', err);
        return false;
    }
});

// ================= 현재 선택된 파일 상태 =================
ipcMain.handle('set-current-password-file', (event, filePath) => {
    currentPasswordFilePath = filePath;
    return true;
});
ipcMain.handle('get-current-password-file', () => {
    return currentPasswordFilePath;
});
ipcMain.handle('set-current-file', (event, filePath) => {
    currentFile = filePath;
});
ipcMain.handle('get-current-file', () => {
    return currentFile;
});

// ================= 팝업 및 렌더러 통신 =================
ipcMain.on('open-add-popup', () => {
    const addWindow = new BrowserWindow({
        width: 400,
        height: 400,
        parent: mainWindow,
        modal: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });
    addWindow.loadFile(path.join(__dirname, 'pages/home/popup.html')).then(()=> {currentPage = 'start';});
});

ipcMain.on('add-password-entry', (event, data) => {
    mainWindow.webContents.send('password-added', data);
});

// ================= CSV 저장/불러오기 =================
ipcMain.handle('save-passwords', async (event, entries) => {
    try {
        if (!currentPasswordFilePath) {
            console.error('[CSV 저장 실패] 파일 경로가 설정되지 않음');
            return false;
        }

        const content = entries.map(e =>
            `${e.title},${e.url},${e.id},${e.pw},${e.tag}`
        ).join('\n');

        // const existing = fs.existsSync(currentPasswordFilePath)
        //     ? fs.readFileSync(currentPasswordFilePath, 'utf-8').split('\n')
        //     : [];

        fs.writeFileSync(currentPasswordFilePath, content, 'utf-8');
        return true;
    } catch (err) {
        console.error('[CSV 저장 실패]', err);
        return false;
    }
});

ipcMain.on('load-passwords', (event) => {
    try {
        if (!currentPasswordFilePath || !fs.existsSync(currentPasswordFilePath)) {
            event.sender.send('passwords-loaded', []);
            return;
        }

        const lines = fs.readFileSync(currentPasswordFilePath, 'utf-8').split('\n');
        const entries = lines.filter(l => l.trim()).map(line => {
            const [title, url, id, pw, tag] = line.split(',');
            return { title, url, id, pw, tag };
        });

        event.sender.send('passwords-loaded', entries);
    } catch (err) {
        console.error('[CSV 불러오기 실패]', err);
        event.sender.send('passwords-loaded', []);
    }
});
