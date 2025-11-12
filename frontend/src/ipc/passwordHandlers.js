// /Users/baki/Desktop/capstone_2/capstone/frontend/src/ipc/passwordHandlers.js

const { sendToBackend } = require('../backend');

function registerPasswordHandlers(ipcMain, context) {
  const {
    getFilePath,
    sendToBackend,
  } = context;

  ipcMain.handle('request-backend', async (_evt, { oper, data }) => {
    const currentFilePath = getFilePath();
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

  ipcMain.handle('getAllPasswords', async () => {
    const currentFilePath = getFilePath();
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

  ipcMain.handle('postMasterKey', async (_evt, { master_key }) => {
    const currentFilePath = getFilePath();
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

  ipcMain.handle('updateMasterKey', async (_evt, { old_master_key, new_master_key }) => {
    const currentFilePath = getFilePath();
    const resp = await sendToBackend('updateMasterKey', {
        old_master_key,
        new_master_key,
        file_path: currentFilePath
    });
    return resp;
  });

  ipcMain.handle('createPasswordEntry', async (_evt, entry) => {
    const currentFilePath = getFilePath();
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

  ipcMain.handle('updatePasswordEntry', async (_evt, updateData) => {
    const currentFilePath = getFilePath();
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

  ipcMain.handle('deletePasswordEntry', async (_evt, { UID }) => {
    const currentFilePath = getFilePath();
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

  ipcMain.handle('searchPasswordEntry', async (_evt, { query }) => {
    const currentFilePath = getFilePath();
    if (!currentFilePath) {
        return { status: false, error_message: '파일이 선택되지 않았습니다.' };
    }
    try {
        const resp = await sendToBackend('searchPasswordEntry', { query });
        return resp;
    } catch (err) {
        console.error('searchPasswordEntry 오류:', err);
        return { status: false, error_message: err.message };
    }
  });

  ipcMain.handle('getPasswordDetail', async (_evt, { UID }) => {
    const currentFilePath = getFilePath();
    if (!currentFilePath) {
        return { status: false, error_message: '파일이 선택되지 않았습니다.' };
    }
    try {
        const resp = await sendToBackend('getPasswordDetail', { UID });
        return resp;
    } catch (err) {
        console.error('getPasswordDetail 오류:', err);
        return { status: false, error_message: err.message };
    }
  });

  ipcMain.handle('getPasswordsByTag', async (_evt, { tag }) => {
    const currentFilePath = getFilePath();
    if (!currentFilePath) {
        return { status: false, error_message: '파일이 선택되지 않았습니다.' };
    }
    try {
        const resp = await sendToBackend('getPasswordsByTag', { tag });
        return resp;
    } catch (err) {
        return { status: false, error_message: err.message };
    }
  });

  ipcMain.handle('get-password-count', async () => {
    const currentFilePath = getFilePath();
    if (!currentFilePath) {
        return { status: false, error_message: '파일이 선택되지 않았습니다.' };
    }
    try {
        const resp = await sendToBackend('getPasswordCount', { file_path: currentFilePath });
        return resp;
    } catch (err) {
        console.error('get-password-count 처리 중 오류:', err);
        return { status: false, error_message: err.message };
    }
  });
}

module.exports = { registerPasswordHandlers };