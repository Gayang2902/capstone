const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const fs = require('fs');
const path = require('path');

// 최근 파일 목록 저장 경로
const recentFilePath = path.join(app.getPath('userData'), 'recent-files.json');

// 현재 사용 중인 CSV 파일 경로 변수
let currentPasswordFilePath = null;
let currentFile = null;

// 메인 윈도우 및 현재 페이지 상태
let mainWindow;
let currentPage = 'start';
let isForceQuit = false;

// 완전 종료 플래그
app.on('before-quit', () => {
    isForceQuit = true;
});

// 메인 윈도우 생성
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

    mainWindow.loadFile(path.join(__dirname, 'pages/start/start.html'));

    mainWindow.on('close', (e) => {
        if (!isForceQuit && currentPage !== 'start') {
            e.preventDefault();
            mainWindow.loadFile(path.join(__dirname, 'pages/start/start.html'));
            currentPage = 'start';
        }
    });
}

// 페이지 이동 처리
ipcMain.on('navigate', (event, page) => {
    const filePath = path.join(__dirname, `pages/${page}/${page}.html`);
    mainWindow.loadFile(filePath);
    currentPage = page;
});

// 스크린샷 보호
ipcMain.on('prevent-screenshot', () => {
    if (mainWindow) mainWindow.setContentProtection(true);
});
ipcMain.on('allow-screenshot', () => {
    if (mainWindow) mainWindow.setContentProtection(false);
});

// 사용자 입력 감지
ipcMain.on('user-active', () => {
    // 타이머 리셋용
});

// 앱 실행
app.whenReady().then(createWindow);
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// 최근 파일 저장
function saveRecentFile(filePath) {
    let list = [];
    if (fs.existsSync(recentFilePath)) {
        list = JSON.parse(fs.readFileSync(recentFilePath));
    }
    if (!list.includes(filePath)) list.unshift(filePath);
    if (list.length > 5) list = list.slice(0, 5);
    fs.writeFileSync(recentFilePath, JSON.stringify(list));
}

// CSV 파일 열기
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

// 최근 파일 목록 반환
ipcMain.handle('get-recent-files', () => {
    if (fs.existsSync(recentFilePath)) {
        return JSON.parse(fs.readFileSync(recentFilePath));
    }
    return [];
});

// 새 CSV 파일 생성
ipcMain.handle('create-file', async () => {
    const { filePath, canceled } = await dialog.showSaveDialog({
        title: '새 비밀번호 파일 만들기',
        defaultPath: 'passwords.csv',
        filters: [{ name: 'CSV 파일', extensions: ['csv'] }]
    });

    if (!canceled && filePath) {
        fs.writeFileSync(filePath, 'master-password\n');
        saveRecentFile(filePath);
        return filePath;
    }

    return null;
});

// 마스터 비밀번호 읽기
ipcMain.handle('read-master-password', (event, filePath) => {
    if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        return content.split('\n')[0].trim();
    }
    return null;
});

// 마스터 비밀번호 저장
ipcMain.handle('set-master-password', (event, filePath, password) => {
    try {
        let content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');
        lines[0] = password;
        fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
        return true;
    } catch (err) {
        console.error('[비밀번호 저장 실패]', err);
        return false;
    }
});

// 현재 파일 경로 설정/반환
ipcMain.handle('set-current-password-file', (event, filePath) => {
    currentPasswordFilePath = filePath;
    return true; // ✅ 추가됨
});
ipcMain.handle('get-current-password-file', () => {
    return currentPasswordFilePath; // ✅ 추가됨
});
ipcMain.handle('set-current-file', (event, filePath) => {
    currentFile = filePath;
});
ipcMain.handle('get-current-file', () => {
    return currentFile;
});

// 팝업 열기
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
    addWindow.loadFile(path.join(__dirname, 'pages/home/popup.html'));
});

// 항목 추가 후 메인에 전송
ipcMain.on('add-password-entry', (event, data) => {
    mainWindow.webContents.send('password-added', data);
});

// CSV 저장
ipcMain.handle('save-passwords', async (event, entries) => {
    try {
        if (!currentPasswordFilePath) throw new Error('파일 경로가 설정되지 않음');

        const content = entries.map(e =>
            `${e.title},${e.url},${e.id},${e.pw},${e.tag}`
        ).join('\n');

        const existing = fs.existsSync(currentPasswordFilePath)
            ? fs.readFileSync(currentPasswordFilePath, 'utf-8').split('\n')
            : ['master-password'];

        existing[0] = existing[0] || 'master-password';

        fs.writeFileSync(currentPasswordFilePath, [existing[0], content].join('\n'), 'utf-8');
        return true;
    } catch (err) {
        console.error('[CSV 저장 실패]', err);
        return false;
    }
});

// CSV 불러오기
ipcMain.on('load-passwords', (event) => {
    try {
        if (!currentPasswordFilePath || !fs.existsSync(currentPasswordFilePath)) {
            event.sender.send('passwords-loaded', []);
            return;
        }

        const lines = fs.readFileSync(currentPasswordFilePath, 'utf-8').split('\n').slice(1);
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


// ✅ JSON으로 저장
ipcMain.handle('save-passwords-json', (event, filePath, entries) => {
    try {
        fs.writeFileSync(filePath, JSON.stringify(entries, null, 2), 'utf-8');
        return true;
    } catch (err) {
        console.error('[JSON 저장 실패]', err);
        return false;
    }
});

// ✅ JSON 불러오기
ipcMain.handle('load-passwords-json', (event, filePath) => {
    try {
        if (!fs.existsSync(filePath)) return [];
        const data = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(data);
    } catch (err) {
        console.error('[JSON 불러오기 실패]', err);
        return [];
    }
});