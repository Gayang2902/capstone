// File: preload.js

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // 페이지 이동
    navigate:           page => ipcRenderer.send('navigate', page),

    // 스크린샷 허용 / 방지
    preventScreenshot:  ()   => ipcRenderer.send('prevent-screenshot'),
    allowScreenshot:    ()   => ipcRenderer.send('allow-screenshot'),

    // 사용자 활동 감지
    userActive:         ()   => ipcRenderer.send('user-active'),

    // 전체 비밀번호 조회 (oper="getAllPasswords")
    getAllPasswords:         () => ipcRenderer.invoke('getAllPasswords'),

    // CSV 파일 열기 다이얼로그
    openFile:           () => ipcRenderer.invoke('openFile'),

    // 새 CSV 파일 생성 다이얼로그
    createFile:         () => ipcRenderer.invoke('createFile'),

    // **마스터 키 인증 요청** (oper="postMasterKey", data={ master_key })
    postMasterKey:      master_key => ipcRenderer.invoke('request-backend', {
        oper: 'postMasterKey',
        data: { master_key }
    }),

    // CSV 파일 경로 설정
    setFilePath:        path => ipcRenderer.send('set-file-path', path),

    // 비밀번호 항목 생성 (oper="createPasswordEntry", data={ file_path, ...entry })
    createPasswordEntry:        data => ipcRenderer.invoke('createPasswordEntry', data),

    // 비밀번호 항목 수정 (oper="updateEntry", data={ file_path, ...updateData })
    updateEntry:        data => ipcRenderer.invoke('updateEntry', data),

    // 비밀번호 항목 삭제 (oper="deleteEntry", data={ file_path, uid })
    deleteEntry:        uid  => ipcRenderer.invoke('deleteEntry', { uid }),

    // 비밀번호 파일 경로 조회
    getFilePath:        () => ipcRenderer.invoke('getFilePath'),

    // 마스터 비밀번호 변경 (oper="updateMasterKey", data={ old_master_key, new_master_key, file_path })
    updateMasterKey:    (old_master_key, new_master_key) =>
        ipcRenderer.invoke('updateMasterKey', {
            old_master_key,
            new_master_key
        }),

    // 세션 만료
    clearBrowserStorage:() => ipcRenderer.send('clear-browser-storage'),

    // CSV 내보내기
    exportCsv:          () => ipcRenderer.invoke('export-csv'),

    // 백엔드 일반 호출(oper/data) – 특별히 필요 시
    requestBackend:     (oper, data) => ipcRenderer.invoke('request-backend', { oper, data }),
});