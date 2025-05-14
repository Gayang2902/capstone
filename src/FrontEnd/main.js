// main.js

const { app, ipcMain, dialog, BrowserWindow: ElectronBrowserWindow } = require('electron');
const fs   = require('fs');
const path = require('path');

let BrowserWindow;    // 실제 사용할 BrowserWindow 클래스
let setVibrancy = null;

// Windows에서는 electron-acrylic-window를, 나머지는 기본 Electron BrowserWindow 사용
if (process.platform === 'win32') {
    ({ BrowserWindow, setVibrancy } = require('electron-acrylic-window'));
} else {
    BrowserWindow = ElectronBrowserWindow;
}

// ================= 앱 초기 설정 =================
const recentFilePath = path.join(app.getPath('userData'), 'recent-files.json');
const favoritePath   = path.join(app.getPath('userData'), 'favorites.json');

let currentPasswordFilePath = null;
let currentFile            = null;
let mainWindow;
let currentPage = 'start';
let isForceQuit = false;

app.on('before-quit', () => {
    isForceQuit = true;
});

// ================= 메인 윈도우 생성 =================
function createWindow() {
    // 공통 옵션
    const windowOpts = {
        width: 1200, // 1440
        height: 700, // 900
        transparent: true,
        frame: false,
        backgroundColor: '#00000000',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        }
    };

    // 플랫폼별 추가 옵션
    if (process.platform === 'darwin') {
        Object.assign(windowOpts, {
            titleBarStyle: 'hidden',
            vibrancy: 'fullscreen-ui'
        });
    } else if (process.platform === 'win32') {
        Object.assign(windowOpts, {
            vibrancy: 'acrylic'
        });
    }

    // 창 생성
    mainWindow = new BrowserWindow(windowOpts);

    // Windows에서만 setVibrancy 호출
    if (process.platform === 'win32' && typeof setVibrancy === 'function') {
        setVibrancy(mainWindow, {
            theme: '#222222aa',
            effect: 'blur',
            useCustomWindowRefreshMethod: true,
            maximumRefreshRate: 60,
            disableOnBlur: true
        });
    }

    loadPage('start');

    mainWindow.on('close', (e) => {
        if (!isForceQuit && currentPage !== 'start') {
            e.preventDefault();
            loadPage('start');
        }
    });
}

// ================= 페이지 로딩 =================
function loadPage(pageName) {
    const filePath = path.join(__dirname, `pages/${pageName}/${pageName}.html`);
    return mainWindow.loadFile(filePath).then(() => {
        currentPage = pageName;
    });
}

// ================= IPC 핸들러 =================
ipcMain.on('navigate', (_e, page) => loadPage(page));
ipcMain.on('prevent-screenshot', () => mainWindow?.setContentProtection(true));
ipcMain.on('allow-screenshot',  () => mainWindow?.setContentProtection(false));
ipcMain.on('user-active',        () => {/* 타이머 리셋용 */});

// 최근 파일
function saveRecentFile(fp) {
    let list = [];
    if (fs.existsSync(recentFilePath)) {
        list = JSON.parse(fs.readFileSync(recentFilePath, 'utf-8'));
    }
    if (!list.includes(fp)) list.unshift(fp);
    if (list.length > 5) list = list.slice(0, 5);
    fs.writeFileSync(recentFilePath, JSON.stringify(list));
}
ipcMain.handle('open-file', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
        title: '파일 선택',
        filters: [{ name: 'CSV 파일', extensions: ['csv'] }],
        properties: ['openFile']
    });
    if (!canceled && filePaths.length) {
        saveRecentFile(filePaths[0]);
        return filePaths[0];
    }
    return null;
});
ipcMain.handle('get-recent-files', () => {
    return fs.existsSync(recentFilePath)
        ? JSON.parse(fs.readFileSync(recentFilePath, 'utf-8'))
        : [];
});

// 파일 생성
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

// 메타(마스터 비밀번호)
function getMetaFilePath(csvFilePath) {
    const dir = path.dirname(csvFilePath);
    const name = path.basename(csvFilePath, '.csv');
    return path.join(dir, `${name}.meta.json`);
}
ipcMain.handle('read-master-password', (_e, fp) => {
    try {
        const mfp = getMetaFilePath(fp);
        if (!fs.existsSync(mfp)) return null;
        const data = JSON.parse(fs.readFileSync(mfp, 'utf-8'));
        if (path.resolve(data.file) !== path.resolve(fp)) return null;
        return data.masterPassword || null;
    } catch {
        return null;
    }
});
ipcMain.handle('set-master-password', (_e, fp, pw) => {
    try {
        const mfp = getMetaFilePath(fp);
        fs.writeFileSync(mfp, JSON.stringify({ file: path.resolve(fp), masterPassword: pw }, null, 2));
        return true;
    } catch {
        return false;
    }
});

// 현재 선택된 파일
ipcMain.handle('set-current-password-file', (_e, fp) => {
    console.log('[main] set-current-password-file →', fp);
    currentPasswordFilePath = fp;
    return true;
});
ipcMain.handle('get-current-password-file', () => currentPasswordFilePath);
ipcMain.handle('set-current-file', (_e, fp) => { currentFile = fp; });
ipcMain.handle('get-current-file', () => currentFile);

// 팝업 (추가 창)
ipcMain.on('open-add-popup', () => {
    const addWindow = new BrowserWindow({
        width: 400,
        height: 400,
        parent: mainWindow,
        modal: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true
        }
    });
    addWindow.loadFile(path.join(__dirname, 'pages/home/popup.html'))
        .then(() => { currentPage = 'start'; });
});
ipcMain.on('add-password-entry', (_e, data) => {
    mainWindow.webContents.send('password-added', data);
});

// CSV 저장/불러오기
ipcMain.handle('save-passwords', async (_e, entries) => {
    if (!currentPasswordFilePath) return false;
    try {
        const content = entries.map(e => `${e.title},${e.url},${e.id},${e.pw},${e.tag}`).join('\n');
        fs.writeFileSync(currentPasswordFilePath, content);
        return true;
    } catch {
        return false;
    }
});
ipcMain.on('load-passwords', (e) => {
    console.log('[main] load-passwords (currentPasswordFilePath)=', currentPasswordFilePath);
    if (!currentPasswordFilePath || !fs.existsSync(currentPasswordFilePath)) {
        return e.sender.send('passwords-loaded', []);
    }
    try {
        const lines = fs.readFileSync(currentPasswordFilePath, 'utf-8').split('\n');
        const entries = lines.filter(l => l).map(line => {
            const [title, url, id, pw, tag] = line.split(',');
            return { title, url, id, pw, tag };
        });
        e.sender.send('passwords-loaded', entries);
    } catch {
        e.sender.send('passwords-loaded', []);
    }
});

// 즐겨찾기
ipcMain.handle('save-favorites', (_e, fav) => {
    try {
        fs.writeFileSync(favoritePath, JSON.stringify(fav, null, 2));
        return true;
    } catch {
        return false;
    }
});
ipcMain.handle('load-favorites', () => {
    try {
        return fs.existsSync(favoritePath)
            ? JSON.parse(fs.readFileSync(favoritePath, 'utf-8'))
            : {};
    } catch {
        return {};
    }
});

// 최근 파일 목록에서 제거
ipcMain.handle('remove-from-recent', (_e, fp) => {
    try {
        if (fs.existsSync(recentFilePath)) {
            let list = JSON.parse(fs.readFileSync(recentFilePath, 'utf-8'));
            list = list.filter(f => f !== fp);
            fs.writeFileSync(recentFilePath, JSON.stringify(list, null, 2));
        }
        return true;
    } catch {
        return false;
    }
});

// 앱 준비 완료 시 창 생성
app.whenReady().then(createWindow);
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});