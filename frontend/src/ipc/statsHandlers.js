// /Users/baki/Desktop/capstone_2/capstone/frontend/src/ipc/statsHandlers.js

function registerStatsHandlers(ipcMain, context) {
  const {
    getFilePath,
    sendToBackend,
  } = context;

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

  ipcMain.handle('getVulnerablePasswords', async (_evt, args) => {
    const currentFilePath = getFilePath();
    if (!currentFilePath) return { status:false, error_message:'파일이 선택되지 않았습니다.' };
    try {
        const resp = await sendToBackend('getVulnerablePasswords', {
            file_path: currentFilePath,
            ...args
        });
        return resp;
    } catch (err) {
        return { status:false, error_message: err.message };
    }
  });

  ipcMain.handle('getVulnerablePasswordCount', async (_evt, args) => {
    const currentFilePath = getFilePath();
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

  ipcMain.handle('getReusedPasswords', async () => {
    const currentFilePath = getFilePath();
    if (!currentFilePath) return { status:false, error_message:'파일이 선택되지 않았습니다.' };
    try {
        const resp = await sendToBackend('getReusedPasswords', { file_path: currentFilePath });
        return resp;
    } catch (err) {
        return { status:false, error_message: err.message };
    }
  });

  ipcMain.handle('getReusedCount', async () => {
    const currentFilePath = getFilePath();
    if (!currentFilePath) return { status:false, error_message:'파일이 선택되지 않았습니다.' };
    try {
        const resp = await sendToBackend('getReusedCount', { file_path: currentFilePath });
        return resp;
    } catch (err) {
        return { status:false, error_message: err.message };
    }
  });

  ipcMain.handle('getOldPasswords', async () => {
    const currentFilePath = getFilePath();
    if (!currentFilePath) return { status:false, error_message:'파일이 선택되지 않았습니다.' };
    try {
        const resp = await sendToBackend('getOldPasswords', { file_path: currentFilePath });
        return resp;
    } catch (err) {
        return { status:false, error_message: err.message };
    }
  });

  ipcMain.handle('getOldCount', async () => {
    const currentFilePath = getFilePath();
    if (!currentFilePath) return { status:false, error_message:'파일이 선택되지 않았습니다.' };
    try {
        const resp = await sendToBackend('getOldCount', { file_path: currentFilePath });
        return resp;
    } catch (err) {
        return { status:false, error_message: err.message };
    }
  });

  ipcMain.handle('getLeakedPasswords', async () => {
    const currentFilePath = getFilePath();
    if (!currentFilePath) return { status:false, error_message:'파일이 선택되지 않았습니다.' };
    try {
        const resp = await sendToBackend('getLeakedPasswords', { file_path: currentFilePath });
        return resp;
    } catch (err) {
        return { status:false, error_message: err.message };
    }
  });

  ipcMain.handle('getLeakedCount', async () => {
    const currentFilePath = getFilePath();
    if (!currentFilePath) return { status:false, error_message:'파일이 선택되지 않았습니다.' };
    try {
        const resp = await sendToBackend('getLeakedCount', { file_path: currentFilePath });
        return resp;
    } catch (err) {
        return { status:false, error_message: err.message };
    }
  });
}

module.exports = { registerStatsHandlers };
