// /Users/baki/Desktop/capstone_2/capstone/frontend/src/ipc/fileHandlers.js

const { dialog } = require('electron');
const fs = require('fs');
const path = require('path');

function registerFileHandlers(ipcMain, mainWindow, context, app) {
  const {
    getFilePath,
    setFilePath,
    addRecentFile,
    getRecentFiles,
    sendToBackend,
  } = context;

  ipcMain.handle('read-file-content', async (event, relativePath) => {
    try {
      const absolutePath = path.join(app.getAppPath(), relativePath);
      const content = fs.readFileSync(absolutePath, 'utf-8');
      return { status: true, content };
    } catch (error) {
      console.error(`Failed to read file content for: ${relativePath}`, error);
      return { status: false, error_message: error.message };
    }
  });

  ipcMain.handle('openFile', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
      title: 'txt 파일 선택',
      properties: ['openFile'],
      filters: [{ name: '텍스트 파일', extensions: ['txt'] }],
    });
    if (canceled) return { status: false, error_message: '파일 선택을 취소했습니다.' };

    const selectedPath = filePaths[0];
    addRecentFile(selectedPath);
    mainWindow.webContents.send('recent-file-list', getRecentFiles());
    return { status: true, file_path: selectedPath };
  });

  ipcMain.handle('createFile', async () => {
    const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
      title: '새 TXT 파일 생성',
      defaultPath: '',
      filters: [{ name: '텍스트 파일', extensions: ['txt'] }],
    });
    if (canceled || !filePath) return { status: false, error_message: '파일 생성을 취소했습니다.' };

    fs.writeFileSync(filePath, '');
    addRecentFile(filePath);
    mainWindow.webContents.send('recent-file-list', getRecentFiles());
    return { status: true, file_path: filePath };
  });

  ipcMain.handle('openFilePath', async (_evt, filePath) => {
    setFilePath(filePath);
    const resp = await sendToBackend('openFile', { file_path: filePath });
    addRecentFile(filePath);
    mainWindow.webContents.send('recent-file-list', getRecentFiles());
    return { ...resp, file_path: filePath };
  });

  ipcMain.handle('getFilePath', async () => {
    return { status: true, file_path: getFilePath() };
  });

  ipcMain.on('set-file-path', (_evt, filePath) => {
    setFilePath(filePath);
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

  ipcMain.handle('export-csv', async () => {
    const currentFilePath = getFilePath();
    if (!currentFilePath) {
        return { status: false, error_message: '파일이 선택되지 않았습니다.' };
    }

    try {
        const resp = await sendToBackend('getAllPasswords', { file_path: currentFilePath });
        if (!resp.status || !Array.isArray(resp.data.data)) {
            return { status: false, error_message: resp.error_message || '백엔드 조회 실패' };
        }
        const allEntries = resp.data.data;

        const exclude = new Set(['UID','type','created_at','modified_at','favorite']);
        const fieldSet = new Set();
        allEntries.forEach(entry => {
            Object.keys(entry).forEach(key => {
                if (!exclude.has(key)) fieldSet.add(key);
            });
        });

        const priority = ['label','comments','host','port','url','email','id','password','userId'];
        const headers = [];
        for (const key of priority) {
            if (fieldSet.has(key)) {
                headers.push(key);
                fieldSet.delete(key);
            }
        }
        const rest = Array.from(fieldSet).sort();
        headers.push(...rest);

        const lines = [ headers.join(',') ];
        const quoteRegex = new RegExp('"', 'g');
        allEntries.forEach(entry => {
            const row = headers.map(key => {
                let v = entry[key] != null ? String(entry[key]) : '';
                if (v.includes(',')) {
                    v = '"' + v.replace(quoteRegex, '""') + '"';
                }
                return v;
            });
            lines.push(row.join(','));
        });
        const txtContent = lines.join('\n');

        const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
            title: '모든 비밀번호 내보내기',
            filters: [{ name: '텍스트 파일', extensions: ['txt'] }],
        });
        if (canceled || !filePath) {
            return { status: false, error_message: '내보내기를 취소했습니다.' };
        }

        fs.writeFileSync(filePath, txtContent, 'utf8');
        return { status: true, file_path: filePath };

    } catch (err) {
        console.error('export-csv 오류:', err);
        return { status: false, error_message: err.message };
    }
  });
}

module.exports = { registerFileHandlers };