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

    // 마스터 비밀번호 관련
    readMasterPassword: (filePath) => ipcRenderer.invoke('read-master-password', filePath),
    setMasterPassword: (filePath, password) => ipcRenderer.invoke('set-master-password', filePath, password),

    // ✅ [수정] 비밀번호 데이터 저장 요청 (파일 경로 포함)
    savePasswords: (entries) => ipcRenderer.invoke('save-passwords', entries),

    // 비밀번호 데이터 불러오기 요청
    loadPasswords: () => ipcRenderer.send('load-passwords'),

    // 비밀번호 데이터 수신
    onPasswordsLoaded: (callback) => {
        ipcRenderer.on('passwords-loaded', (event, data) => callback(data));
    }
});

// // 팝업 열기
// openAddPopup: () => ipcRenderer.send('open-add-popup'),
//
// // 팝업에서 새 비밀번호 항목 추가 수신
// onPasswordAdded: (callback) => {
//     ipcRenderer.on('password-added', (event, data) => callback(data));
// }