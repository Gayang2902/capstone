
const { spawn } = require('child_process');
const path = require('path');

let backendProcess;
let stdoutBuffer = '';
let nextReqId = 1;
const pending = {};

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
            exePath = path.join(__dirname, '..', '..', 'backend', 'build', 'mac', 'mac', 'main');
            break;
        case 'win32':
            exePath = path.join(__dirname, '..', '..', 'backend', 'x64', 'Release', 'capstone_backend.exe');
            break;
        case 'linux':
            exePath = path.join(__dirname, '..', '..', 'backend', 'build', 'linux', 'main');
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

function getBackendProcess() {
    return backendProcess;
}

function registerBackendIpc(ipcMain) {
    ipcMain.handle('request-backend', async (event, oper, data) => {
        try {
            return await sendToBackend(oper, data);
        } catch (error) {
            console.error('Error in request-backend handler:', error);
            return { status: false, error_message: error.message };
        }
    });
}

module.exports = {
    startBackend,
    sendToBackend,
    getBackendProcess,
    registerBackendIpc
};
