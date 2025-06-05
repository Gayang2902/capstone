// File: main.js

const { app, BrowserWindow, ipcMain, dialog, screen } = require('electron');
const { spawn } = require('child_process');
const fs   = require('fs');
const path = require('path');

let currentFilePath = '';   // 현재 선택된 TXT 파일 경로

let mainWindow;
let backendProcess;
let stdoutBuffer = '';
let nextReqId = 1;
const pending = {};

// 백엔드 준비 상태 관리
let backendReady = false;
let backendReadyPromise;
let backendReadyResolve;

/** 1) 백엔드 프로세스 시작 (spawn) */
function startBackend() {
    backendReadyPromise = new Promise(resolve => {
        backendReadyResolve = resolve;
    });

    // ▶ 변경된 백엔드 바이너리 경로
    const exePath = path.join(
        __dirname,
        '..',
        'BackEnd',
        'backend',
        'build',
        'mac',
        'main'
    );

    // C++ 백엔드 실행 (cwd 옵션은 필요 없거나 exePath에 맞춰 조정)
    backendProcess = spawn(exePath, [], {
        stdio: ['pipe', 'pipe', 'inherit']
    });
    backendProcess.stdout.setEncoding('utf8');

    // spawn 직후 바로 준비 완료 처리
    backendReady = true;
    backendReadyResolve();

    backendProcess.stdout.on('data', chunk => {
        console.log('[DEBUG] 백엔드 → 프론트 raw stdout chunk:', JSON.stringify(chunk));

        stdoutBuffer += chunk;
        let lines = stdoutBuffer.split('\n');
        stdoutBuffer = lines.pop();

        for (let line of lines) {
            if (!line.trim()) continue;

            // JSON 응답 파싱
            let msg;
            try {
                msg = JSON.parse(line);
            } catch (e) {
                console.error('Invalid JSON from backend:', line);
                continue;
            }

            let parsedId = msg.id;
            const payload = (() => {
                const { id, ...rest } = msg;
                return rest;
            })();

            if (parsedId !== undefined && pending[parsedId]) {
                pending[parsedId].resolve(payload);
                delete pending[parsedId];
            } else {
                const pendingKeys = Object.keys(pending);
                if (pendingKeys.length === 1) {
                    const onlyKey = pendingKeys[0];
                    pending[onlyKey].resolve(msg);
                    delete pending[onlyKey];
                } else {
                    console.warn('[WARN] 응답에 id가 없고, pending이 여러 개 있습니다:', msg);
                }
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

/** 2) 백엔드에 JSON 요청 보내기 */
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
        console.log('[DEBUG] 프론트 → 백 payload (id 제외):', JSON.stringify(rawPayload));

        backendProcess.stdin.write(JSON.stringify(rawPayload) + '\n');

        timeoutHandle = setTimeout(() => {
            if (pending[id]) {
                pending[id].reject(new Error('백엔드 응답 타임아웃'));
                delete pending[id];
            }
        }, 10000);
    });
}

/** 3) 메인 윈도우 생성 */
function createMainWindow() {
    const { width: sw } = screen.getPrimaryDisplay().workAreaSize;

    let winWidth = Math.min(Math.max(Math.floor(sw * 0.75), 1024), 1366);
    let winHeight = Math.round(winWidth * 9 / 16);

    mainWindow = new BrowserWindow({
        width: winWidth,
        height: winHeight,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
        contentProtection: true,
    });

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

ipcMain.on('navigate', (_evt, page) => {
    mainWindow.loadFile(path.join(__dirname, 'pages', page, `${page}.html`));
});

ipcMain.on('prevent-screenshot',    () => mainWindow.setContentProtection(true));
ipcMain.on('allow-screenshot',      () => mainWindow.setContentProtection(false));

ipcMain.on('user-active', () => {});

ipcMain.on('clear-browser-storage', async () => {
    try {
        await mainWindow.webContents.session.clearStorageData();
        await mainWindow.webContents.session.clearCache();
    } catch (err) {
        console.error('Storage clear error:', err);
    }
});

/** (1) request-backend 핸들러 (렌더러 → C++ 백엔드) */
ipcMain.handle('request-backend', async (_evt, { oper, data }) => {
    if (!currentFilePath) {
        return { status: false, error_message: '파일이 선택되지 않았습니다.' };
    }
    try {
        const resp = await sendToBackend(oper, data);
        return resp;
    } catch (err) {
        console.error('request-backend 오류:', err);
        return { status: false, error_message: err.message };
    }
});

/** (2) 전체 비밀번호 조회 */
ipcMain.handle('getAllPwds', async () => {
    if (!currentFilePath) {
        return { status: false, error_message: '파일이 선택되지 않았습니다.' };
    }
    try {
        const resp = await sendToBackend('getAllPwds', { file_path: currentFilePath });
        return resp;
    } catch (err) {
        console.error('getAllPwds 오류:', err);
        return { status: false, error_message: err.message };
    }
});

/** (3) TXT 파일 열기 다이얼로그 + 백엔드에 openFile 요청 */
ipcMain.handle('openFile', async () => {
    try {
        const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
            title: 'TXT 파일 선택',
            properties: ['openFile'],
            filters: [{ name: '텍스트 파일', extensions: ['txt'] }],
        });
        if (canceled) return { status: false, error_message: '파일 선택을 취소했습니다.' };

        const selectedPath = filePaths[0];
        currentFilePath = selectedPath;

        const resp = await sendToBackend('openFile', { file_path: selectedPath });

        return {
            status: resp.status,
            error_message: resp.error_message,
            file_path: selectedPath,
            data: resp.data
        };
    } catch (err) {
        console.error('openFile 오류:', err);
        return { status: false, error_message: err.message };
    }
});

/** (4) 새 TXT 파일 생성 다이얼로그 */
ipcMain.handle('createFile', async () => {
    try {
        const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
            title: '새 TXT 파일 생성',
            defaultPath: 'passwords.txt',
            filters: [{ name: '텍스트 파일', extensions: ['txt'] }],
        });
        if (canceled) return { status: false, error_message: '파일 생성을 취소했습니다.' };

        fs.writeFileSync(filePath, '');
        currentFilePath = filePath;
        const resp = await sendToBackend('openFile', { file_path: filePath });

        return {
            status: resp.status,
            error_message: resp.error_message,
            file_path: filePath,
            data: resp.data
        };
    } catch (err) {
        console.error('createFile 오류:', err);
        return { status: false, error_message: err.message };
    }
});

/** (5) 마스터 키 인증 요청 */
ipcMain.handle('postMasterKey', async (_evt, { master_key }) => {
    if (!currentFilePath) {
        return { status: false, error_message: '파일이 선택되지 않았습니다.' };
    }
    try {
        const resp = await sendToBackend('postMasterKey', {
            master_key,
            file_path:  currentFilePath
        });
        return resp;
    } catch (err) {
        console.error('postMasterKey 오류:', err);
        return { status: false, error_message: err.message };
    }
});

/** (6) 마스터 비밀번호 변경 */
ipcMain.handle('updateMasterKey', async (_evt, { old_master_key, new_master_key }) => {
    if (!currentFilePath) {
        return { status: false, error_message: '파일이 선택되지 않았습니다.' };
    }
    try {
        const resp = await sendToBackend('updateMasterKey', {
            old_master_key,
            new_master_key,
            file_path: currentFilePath
        });
        return resp;
    } catch (err) {
        console.error('updateMasterKey 오류:', err);
        return { status: false, error_message: err.message };
    }
});

/** TXT 내보내기 */
ipcMain.handle('export-csv', async () => {
    if (!currentFilePath) {
        return { status: false, error_message: '파일이 선택되지 않았습니다.' };
    }

    try {
        const resp = await sendToBackend('getAllPwds', { file_path: currentFilePath });
        if (!resp.status) {
            return { status: false, error_message: resp.error_message || '백엔드 조회 실패' };
        }
        const allPwds = resp.data;

        const header = ['uid', 'label', 'type', 'userId', 'password'];
        const lines = [header.join(',')];
        allPwds.forEach(entry => {
            const row = [
                entry.uid || '',
                entry.label || '',
                entry.type || '',
                entry.userId || '',
                entry.password || ''
            ];
            lines.push(row.join(','));
        });
        const txtContent = lines.join('\n');

        const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
            title: 'TXT로 내보내기',
            defaultPath: 'exported_passwords.txt',
            filters: [{ name: '텍스트 파일', extensions: ['txt'] }],
        });
        if (canceled || !filePath) {
            return { status: false, error_message: '내보내기를 취소했습니다.' };
        }

        fs.writeFileSync(filePath, txtContent, 'utf8');
        return { status: true, file_path: filePath };
    } catch (err) {
        console.error('export-txt 오류:', err);
        return { status: false, error_message: err.message };
    }
});

/** TXT 파일 경로 설정 */
ipcMain.on('set-file-path', (_evt, filePath) => {
    currentFilePath = filePath;

    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n').filter(line => line.trim());
        const dataList = lines.slice(1).map(line => {
            const cols = line.split(',');
            return {
                uid:      (cols[0] || '').trim(),
                label:    (cols[1] || '').trim(),
                type:     (cols[2] || '').trim(),
                userId:   (cols[3] || '').trim(),
                password: (cols[4] || '').trim()
            };
        });
        mainWindow.webContents.send('file-loaded', { status: true, data: dataList });
    } catch (err) {
        console.error('TXT parsing error:', err);
        mainWindow.webContents.send('file-loaded', { status: false, error_message: err.message });
    }
});

/** 비밀번호 파일 경로 조회 */
ipcMain.handle('getFilePath', async () => {
    return { status: true, file_path: currentFilePath };
});

/** 비밀번호 항목 생성 */
ipcMain.handle('createPasswordEntry', async (_evt, entry) => {
    if (!currentFilePath) {
        return { status: false, error_message: '파일이 선택되지 않았습니다.' };
    }
    try {
        const resp = await sendToBackend('createPasswordEntry', {
            file_path: currentFilePath,
            ...entry
        });
        return resp;
    } catch (err) {
        console.error('createPasswordEntry 오류:', err);
        return { status: false, error_message: err.message };
    }
});

/** 비밀번호 항목 수정 */
ipcMain.handle('updateEntry', async (_evt, updateData) => {
    if (!currentFilePath) {
        return { status: false, error_message: '파일이 선택되지 않았습니다.' };
    }
    try {
        const resp = await sendToBackend('updateEntry', {
            file_path: currentFilePath,
            ...updateData
        });
        return resp;
    } catch (err) {
        console.error('updateEntry 오류:', err);
        return { status: false, error_message: err.message };
    }
});

/** 비밀번호 항목 삭제 */
ipcMain.handle('deleteEntry', async (_evt, { uid }) => {
    if (!currentFilePath) {
        return { status: false, error_message: '파일이 선택되지 않았습니다.' };
    }
    try {
        const resp = await sendToBackend('deleteEntry', {
            file_path: currentFilePath,
            uid
        });
        return resp;
    } catch (err) {
        console.error('deleteEntry 오류:', err);
        return { status: false, error_message: err.message };
    }
});