const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // 페이지 이동
    navigate: (page) => ipcRenderer.send('navigate', page),

    // 스크린샷 방지/허용
    preventScreenshot: () => ipcRenderer.send('prevent-screenshot'),
    allowScreenshot: () => ipcRenderer.send('allow-screenshot'),

    // 사용자 입력 감지
    userActive: () => ipcRenderer.send('user-active'),

    // 파일 관련
    openFile: () => ipcRenderer.invoke('open-file'),
    createFile: () => ipcRenderer.invoke('create-file'),
    getRecentFiles: () => ipcRenderer.invoke('get-recent-files'),

    // 현재 파일 경로
    setCurrentPasswordFile: (filePath) => ipcRenderer.invoke('set-current-password-file', filePath),
    getCurrentPasswordFile: () => ipcRenderer.invoke('get-current-password-file'),

    // 마스터 비밀번호 관련
    readMasterPassword: (filePath) => ipcRenderer.invoke('read-master-password', filePath),
    setMasterPassword: (filePath, password) => ipcRenderer.invoke('set-master-password', filePath, password),

    // 비밀번호 데이터 저장/불러오기
    savePasswords: (entries) => ipcRenderer.invoke('save-passwords', entries),
    loadPasswords: () => ipcRenderer.send('load-passwords'),
    onPasswordsLoaded: (callback) => ipcRenderer.on('passwords-loaded', (event, data) => callback(data)),

    // 현재 선택된 CSV 파일 관련 (start 페이지에서 고른 파일 home 과 연동)
    setCurrentFile: (filePath) => ipcRenderer.invoke('set-current-file', filePath),
    getCurrentFile: () => ipcRenderer.invoke('get-current-file'),

    // 최근 파일 목록에서 제거 (start)
    removeFromRecent: (filePath) => ipcRenderer.invoke('remove-from-recent', filePath),

    // 즐겨찾기 저장 / 불러오기
    saveFavorites: (fav) => ipcRenderer.invoke('save-favorites', fav),
    loadFavorites: () => ipcRenderer.invoke('load-favorites'),

});