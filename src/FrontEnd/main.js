// main.js
const { app, BrowserWindow, ipcMain, dialog, screen } = require('electron');
const { spawn } = require('child_process');
const fs   = require('fs');
const path = require('path');

// Mock backend mode: true면 모의, false면 실제 C 프로세스 사용
const MOCK_BACKEND = true;

let mainWindow;
let backendProcess;
let stdoutBuffer = '';
let nextReqId = 1;
const pending = {};

/** 1) 백엔드 프로세스 시작 (spawn) */
function startBackend() {
    if (MOCK_BACKEND) {
        console.warn('⚠️ Mock backend enabled – 실제 C 프로세스 실행 건너뜁니다.');
        return;
    }
    const exePath = path.join(__dirname, 'backend', 'your_backend_executable');
    backendProcess = spawn(exePath, [], { stdio: ['pipe','pipe','inherit'] });
    backendProcess.stdout.setEncoding('utf8');
    backendProcess.stdout.on('data', chunk => {
        stdoutBuffer += chunk;
        let lines = stdoutBuffer.split('\n');
        stdoutBuffer = lines.pop();
        for (let line of lines) {
            if (!line.trim()) continue;
            let msg;
            try { msg = JSON.parse(line); }
            catch (e) { console.error('Invalid JSON from backend:', line); continue; }
            const { id, ...payload } = msg;
            if (pending[id]) {
                pending[id].resolve(payload);
                delete pending[id];
            }
        }
    });
    backendProcess.on('exit', (code, signal) => {
        console.error(`백엔드 종료 (code=${code}, signal=${signal})`);
    });
}

/** 2) 백엔드에 JSON 요청 보내기 */
function sendToBackend(oper, data) {
    return new Promise((resolve, reject) => {
        const id = nextReqId++;
        pending[id] = { resolve, reject };
        backendProcess.stdin.write(JSON.stringify({ id, oper, data }) + '\n');
        setTimeout(() => {
            if (pending[id]) {
                reject(new Error('백엔드 응답 타임아웃'));
                delete pending[id];
            }
        }, 5000);
    });
}

/** 3) 윈도우 생성 */
function createMainWindow() {
    // 1) 화면 실제 사용 영역 크기 가져오기
    const { width: sw } = screen.getPrimaryDisplay().workAreaSize;

    // 2) 너비를 화면 너비의 75%로, 최소 1024px, 최대 1366px로 제한
    let winWidth = Math.min(Math.max(Math.floor(sw * 0.75), 1024), 1366);
    // 3) 16:9 비율에 맞춰 높이 계산
    let winHeight = Math.round(winWidth * 9 / 16);

    mainWindow = new BrowserWindow({
        width: winWidth,
        height: winHeight,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
        contentProtection: true,  // 스크린샷 방지 기본 ON
    });

    // 시작 페이지 로드
    mainWindow.loadFile(path.join(__dirname, 'pages', 'start', 'start.html'));
}

// --- 앱 라이프사이클 ---
app.whenReady().then(() => {
    startBackend();
    createMainWindow();
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
    });
});
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        if (backendProcess) backendProcess.kill();
        app.quit();
    }
});

// --- IPC 핸들러 ---
// 페이지 전환
ipcMain.on('navigate', (_evt, page) => {
    mainWindow.loadFile(path.join(__dirname, 'pages', page, `${page}.html`));
});
// 스크린샷 토글
ipcMain.on('prevent-screenshot', () => mainWindow.setContentProtection(true));
ipcMain.on('allow-screenshot',    () => mainWindow.setContentProtection(false));
// 사용자 활동
ipcMain.on('user-active', () => { /* 필요 시 처리 */ });

// --- IPC 채널 분리 ---
ipcMain.handle('getAllPwds', async () => {
  try {
    return MOCK_BACKEND
      ? { status: true, data: [] }
      : await sendToBackend('getAllPwds', {});
  } catch (err) {
    return { status: false, error_message: err.message };
  }
});

ipcMain.handle('openFile', async () => {
  try {
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
      title: 'CSV 파일 선택',
      properties: ['openFile'],
      filters: [{ name: 'CSV', extensions: ['csv'] }],
    });
    if (canceled) return { status: false, error_message: '파일 선택을 취소했습니다.' };
    return { status: true, file_path: filePaths[0] };
  } catch (err) {
    return { status: false, error_message: err.message };
  }
});

ipcMain.handle('createFile', async () => {
  try {
    const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
      title: '새 CSV 파일 생성',
      defaultPath: 'passwords.csv',
      filters: [{ name: 'CSV', extensions: ['csv'] }],
    });
    if (canceled) return { status: false, error_message: '파일 생성을 취소했습니다.' };
    fs.writeFileSync(filePath, '');
    return { status: true, file_path: filePath };
  } catch (err) {
    return { status: false, error_message: err.message };
  }
});

ipcMain.handle('postMasterKey', async (_evt, { master_key, file_path }) => {
  try {
    return MOCK_BACKEND
      ? { status: true }
      : await sendToBackend('postMasterKey', { master_key, file_path });
  } catch (err) {
    return { status: false, error_message: err.message };
  }
});

ipcMain.handle('createEntry', async (_evt, data) => {
  try {
    return MOCK_BACKEND
      ? { status: true, uid: 'mock-' + Date.now() }
      : await sendToBackend('createEntry', data);
  } catch (err) {
    return { status: false, error_message: err.message };
  }
});

ipcMain.handle('updateEntry', async (_evt, data) => {
  try {
    return MOCK_BACKEND
      ? { status: true }
      : await sendToBackend('updateEntry', data);
  } catch (err) {
    return { status: false, error_message: err.message };
  }
});

ipcMain.handle('deleteEntry', async (_evt, { uid }) => {
  try {
    return MOCK_BACKEND
      ? { status: true }
      : await sendToBackend('deleteEntry', { uid });
  } catch (err) {
    return { status: false, error_message: err.message };
  }
});