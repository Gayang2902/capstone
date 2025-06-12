// File: main.js

const { app, BrowserWindow, ipcMain, dialog, screen, clipboard } = require('electron');
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

    // KDU - 운영체제별 테스트 자동 경로
    let exePath;
    switch (process.platform) {
        case 'darwin': // macOS
            exePath = path.join(__dirname, '..', 'backend', 'build', 'mac', 'main');
            break;
        case 'win32': // Windows
            exePath = path.join(__dirname, '..', 'backend', 'x64', 'Release', 'capstone_backend.exe');
            break;
        case 'linux': // Linux
            exePath = path.join(__dirname, '..', 'backend', 'build', 'linux', 'main');
            break;
        default:
            throw new Error(`지원하지 않는 플랫폼: ${process.platform}`);
    }

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

/** 3) 메인 윈도우 생성 */
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
    });

    mainWindow.loadFile(path.join(__dirname, 'pages', 'start', 'start.html'));

    mainWindow.webContents.openDevTools({ mode: 'right' }); // 개발자 모드
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
ipcMain.handle('getAllPasswords', async () => {
    if (!currentFilePath) {
        return { status: false, error_message: '파일이 선택되지 않았습니다.' };
    }
    try {
        const resp = await sendToBackend('getAllPasswords', { file_path: currentFilePath });
        return resp;
    } catch (err) {
        console.error('getAllPasswords 오류:', err);
        return { status: false, error_message: err.message };
    }
});

/** (3) TXT 파일 열기 다이얼로그 + 백엔드에 openFile 요청 */
ipcMain.handle('openFile', async () => {
    try {
        const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
            title: 'txt 파일 선택',
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

// /** (6) 마스터 비밀번호 변경 */
// ipcMain.handle('updateMasterKey', async (_evt, { old_master_key, new_master_key }) => {
//     if (!currentFilePath) {
//         return { status: false, error_message: '파일이 선택되지 않았습니다.' };
//     }
//     try {
//         const resp = await sendToBackend('updateMasterKey', {
//             old_master_key,
//             new_master_key,
//             file_path: currentFilePath
//         });
//         return resp;
//     } catch (err) {
//         console.error('updateMasterKey 오류:', err);
//         return { status: false, error_message: err.message };
//     }
// });

ipcMain.handle('updateMasterKey', async (_evt, { old_master_key, new_master_key }) => {
    const resp = await sendToBackend('updateMasterKey', {
        old_master_key,
        new_master_key,
        file_path: currentFilePath
    });
    return resp;
});

// File: src/main.js

/** TXT 내보내기 — 모든 비밀번호 항목의 모든 필드를 포함 (일부 메타 필드 제외) */
ipcMain.handle('export-csv', async () => {
    if (!currentFilePath) {
        return { status: false, error_message: '파일이 선택되지 않았습니다.' };
    }

    try {
        // 1) 전체 비밀번호 조회
        const resp = await sendToBackend('getAllPasswords', { file_path: currentFilePath });
        if (!resp.status || !Array.isArray(resp.data.data)) {
            return { status: false, error_message: resp.error_message || '백엔드 조회 실패' };
        }
        const allEntries = resp.data.data;

        if (allEntries.length === 0) {
            return { status: false, error_message: '내보낼 비밀번호가 없습니다.' };
        }

        // 2) 모든 키 수집 (메타 필드 제외)
        const exclude = new Set(['UID','type','created_at','modified_at','favorite']);
        const fieldSet = new Set();
        allEntries.forEach(entry => {
            Object.keys(entry).forEach(key => {
                if (!exclude.has(key)) fieldSet.add(key);
            });
        });

        // 우선순위 필드 순서 지정
        const priority = ['label','comments','host','port','url','email','id','password','userId'];
        const headers = [];
        for (const key of priority) {
            if (fieldSet.has(key)) {
                headers.push(key);
                fieldSet.delete(key);
            }
        }
        // 그 외 남은 필드 알파벳 순 추가
        const rest = Array.from(fieldSet).sort();
        headers.push(...rest);

        // 3) CSV/텍스트 콘텐츠 생성
        const lines = [ headers.join(',') ];
        allEntries.forEach(entry => {
            const row = headers.map(key => {
                let v = entry[key] != null ? String(entry[key]) : '';
                if (v.includes(',')) v = `"${v.replace(/"/g,'""')}"`;
                return v;
            });
            lines.push(row.join(','));
        });
        const txtContent = lines.join('\n');

        // 4) 저장 대화상자
        const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
            title: '모든 비밀번호 내보내기',
            // defaultPath: '', // 기본 내보내기 이름
            filters: [{ name: '텍스트 파일', extensions: ['txt'] }],
        });
        if (canceled || !filePath) {
            return { status: false, error_message: '내보내기를 취소했습니다.' };
        }

        // 5) 파일 쓰기
        fs.writeFileSync(filePath, txtContent, 'utf8');
        return { status: true, file_path: filePath };

    } catch (err) {
        console.error('export-csv 오류:', err);
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
ipcMain.handle('updatePasswordEntry', async (_evt, updateData) => {
    if (!currentFilePath) {
        return { status: false, error_message: '파일이 선택되지 않았습니다.' };
    }
    try {
        const resp = await sendToBackend('updatePasswordEntry', {
            file_path: currentFilePath,
            ...updateData
        });
        return resp;
    } catch (err) {
        console.error('updatePasswordEntry 오류:', err);
        return { status: false, error_message: err.message };
    }
});

/** 비밀번호 항목 삭제 */
ipcMain.handle('deletePasswordEntry', async (_evt, { UID }) => {
    if (!currentFilePath) {
        return { status: false, error_message: '파일이 선택되지 않았습니다.' };
    }
    try {
        const resp = await sendToBackend('deletePasswordEntry', { UID });
        return resp;
    } catch (err) {
        console.error('deletePasswordEntry 오류:', err);
        return { status: false, error_message: err.message };
    }
});

/** (7) 검색된 비밀번호 조회 */
ipcMain.handle('searchPasswordEntry', async (_evt, { query }) => {
    console.log('[MAIN] searchPasswordEntry 호출, query =', query);
    if (!currentFilePath) {
        return { status: false, error_message: '파일이 선택되지 않았습니다.' };
    }
    try {
        // C++ handler searchPasswordEntry expects only { query }
        const resp = await sendToBackend('searchPasswordEntry', { query });
        return resp;
    } catch (err) {
        console.error('searchPasswordEntry 오류:', err);
        return { status: false, error_message: err.message };
    }
})

// ipcMain.handle('getVulnerablePasswords', async () => {
//     const resp = await sendToBackend('getVulnerablePasswords', { file_path: currentFilePath });
//     return resp;
// });
// ipcMain.handle('getOldPasswords', async () => {
//     const resp = await sendToBackend('getOldPasswords', { file_path: currentFilePath });
//     return resp;
// });
// ipcMain.handle('getReusedPasswords', async () => {
//     const resp = await sendToBackend('getReusedPasswords', { file_path: currentFilePath });
//     return resp;
// });

/** (8) 총 비밀번호 개수 조회 */
ipcMain.handle('getPasswordCount', async () => {
    if (!currentFilePath) {
        return { status: false, error_message: '파일이 선택되지 않았습니다.' };
    }
    try {
        const resp = await sendToBackend('getPasswordCount', { file_path: currentFilePath });
        return resp;
    } catch (err) {
        console.error('getPasswordCount 오류:', err);
        return { status: false, error_message: err.message };
    }
});

// 비밀번호 상세 조회 핸들러
ipcMain.handle('getPasswordDetail', async (_evt, { UID }) => {
    if (!currentFilePath) {
        return { status: false, error_message: '파일이 선택되지 않았습니다.' };
    }
    try {
        // C++ 백엔드로 oper="getPasswordDetail", data={ UID } 요청
        const resp = await sendToBackend('getPasswordDetail', { UID });
        return resp;  // { status: true, data: { pwd: '...' } } 형태로 반환됨
    } catch (err) {
        console.error('getPasswordDetail 오류:', err);
        return { status: false, error_message: err.message };
    }
});

// Write text to clipboard and clear after 30 seconds
ipcMain.handle('writeClipboard', async (_evt, text) => {
    clipboard.writeText(text);
    setTimeout(() => {
        // clear clipboard after 30 seconds
        clipboard.clear();
    }, 30000);
    return { status: true };
});

// ipcMain.handle('getPasswordCount', async () => {
//     try {
//         const resp = await sendToBackend('getPasswordCount', {});
//         return resp;
//     } catch (err) {
//         return { status: false, error_message: err.message };
//     }
// });

ipcMain.handle('getStrongCount', async () => {
    try {
        const resp = await sendToBackend('getStrongCount', {});
        return resp;
    } catch (err) {
        return { status: false, error_message: err.message };
    }
});

ipcMain.handle('getNormalCount', async () => {
    try {
        const resp = await sendToBackend('getNormalCount', {});
        return resp;
    } catch (err) {
        return { status: false, error_message: err.message };
    }
});

ipcMain.handle('getWeakCount', async () => {
    try {
        const resp = await sendToBackend('getWeakCount', {});
        return resp;
    } catch (err) {
        return { status: false, error_message: err.message };
    }
});

// ipcMain.handle('getVulnerablePasswordCount', async (_evt, { type, tag }) => {
//     if (!currentFilePath) {
//         return { status: false, error_message: '파일이 선택되지 않았습니다.' };
//     }
//     try {
//         // backend 에 oper 과 data 전달 (file_path 포함)
//         const resp = await sendToBackend('getVulnerablePasswordCount', {
//             file_path: currentFilePath,
//             type,
//             // tag 파라미터가 없어도 빈 문자열로 넘겨줍니다
//             tag: tag || ''
//         });
//         return resp;
//     } catch (err) {
//         console.error('getVulnerablePasswordCount 오류:', err);
//         return { status: false, error_message: err.message };
//     }
// });

// (X) strength 리스트
ipcMain.handle('getVulnerablePasswords', async (_evt, args) => {
    if (!currentFilePath) return { status:false, error_message:'파일이 선택되지 않았습니다.' };
    try {
        // args = { type: 'strong'|'normal'|'weak', tag?: string }
        const resp = await sendToBackend('getVulnerablePasswords', {
            file_path: currentFilePath,
            ...args
        });
        return resp;
    } catch (err) {
        return { status:false, error_message: err.message };
    }
});

// (Y) strength 개수
ipcMain.handle('getVulnerablePasswordCount', async (_evt, args) => {
    if (!currentFilePath) return { status:false, error_message:'파일이 선택되지 않았습니다.' };
    try {
        const resp = await sendToBackend('getVulnerablePasswordCount', {
            file_path: currentFilePath,
            ...args
        });
        return resp;
    } catch (err) {
        return { status:false, error_message: err.message };
    }
});

// 재사용된 비밀번호 리스트
ipcMain.handle('getReusedPasswords', async () => {
    if (!currentFilePath) return { status:false, error_message:'파일이 선택되지 않았습니다.' };
    try {
        const resp = await sendToBackend('getReusedPasswords', { file_path: currentFilePath });
        return resp;
    } catch (err) {
        return { status:false, error_message: err.message };
    }
});

// 재사용된 비밀번호 개수
ipcMain.handle('getReusedCount', async () => {
    if (!currentFilePath) return { status:false, error_message:'파일이 선택되지 않았습니다.' };
    try {
        const resp = await sendToBackend('getReusedCount', { file_path: currentFilePath });
        return resp;
    } catch (err) {
        return { status:false, error_message: err.message };
    }
});

// 오래된 비밀번호 리스트
ipcMain.handle('getOldPasswords', async () => {
    if (!currentFilePath) return { status:false, error_message:'파일이 선택되지 않았습니다.' };
    try {
        const resp = await sendToBackend('getOldPasswords', { file_path: currentFilePath });
        return resp;
    } catch (err) {
        return { status:false, error_message: err.message };
    }
});

// 오래된 비밀번호 개수
ipcMain.handle('getOldCount', async () => {
    if (!currentFilePath) return { status:false, error_message:'파일이 선택되지 않았습니다.' };
    try {
        const resp = await sendToBackend('getOldCount', { file_path: currentFilePath });
        return resp;
    } catch (err) {
        return { status:false, error_message: err.message };
    }
});