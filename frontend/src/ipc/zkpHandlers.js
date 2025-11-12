const { dialog } = require('electron');
const {
  signup,
  login,
  uploadFile,
  downloadFile,
  getToken
} = require('../zkp/zkpClient');

function registerZkpHandlers(ipcMain, context, mainWindow) {
  const { getFilePath } = context;

  ipcMain.handle('zkp:signup', async (_evt, { username, password }) => {
    if (!username || !password) {
      return { status: false, error_message: '아이디와 비밀번호를 모두 입력하세요.' };
    }
    try {
      const message = await signup(username.trim(), password);
      return { status: true, message: message || 'OK' };
    } catch (error) {
      console.error('ZKP signup failed:', error);
      return { status: false, error_message: error.message };
    }
  });

  ipcMain.handle('zkp:login', async (_evt, { username, password }) => {
    if (!username || !password) {
      return { status: false, error_message: '아이디와 비밀번호를 모두 입력하세요.' };
    }
    try {
      const token = await login(username.trim(), password);
      return { status: true, token };
    } catch (error) {
      console.error('ZKP login failed:', error);
      return { status: false, error_message: error.message };
    }
  });

  ipcMain.handle('zkp:upload', async () => {
    const currentFilePath = getFilePath();
    if (!currentFilePath) {
      return { status: false, error_message: '먼저 CSV 파일을 열어주세요.' };
    }
    try {
      const response = await uploadFile(currentFilePath);
      return { status: true, message: response?.message || '업로드 완료' };
    } catch (error) {
      console.error('ZKP upload failed:', error);
      return { status: false, error_message: error.message };
    }
  });

  ipcMain.handle('zkp:download', async () => {
    const token = getToken();
    if (!token) {
      return { status: false, error_message: '먼저 로그인하세요.' };
    }
    const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
      title: '다운로드할 암호화 파일 저장',
      defaultPath: 'downloaded.kdb',
      filters: [{ name: 'KeePass Database', extensions: ['kdb', 'kdbx', 'bin'] }]
    });
    if (canceled || !filePath) {
      return { status: false, error_message: '저장을 취소했습니다.' };
    }
    try {
      await downloadFile(filePath);
      return { status: true, file_path: filePath };
    } catch (error) {
      console.error('ZKP download failed:', error);
      return { status: false, error_message: error.message };
    }
  });

}

module.exports = { registerZkpHandlers };
