// File: preload.js

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // 페이지 이동
    navigate:           page => ipcRenderer.send('navigate', page),
    onNavigate:         callback => {
        if (typeof callback !== 'function') return () => undefined;
        const listener = (_event, page) => callback(page);
        ipcRenderer.on('renderer:navigate', listener);
        return () => ipcRenderer.removeListener('renderer:navigate', listener);
    },

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

    openFilePath: filePath => ipcRenderer.invoke('openFilePath', filePath),

    // **마스터 키 인증 요청** (oper="postMasterKey", data={ master_key })
    postMasterKey:      master_key => ipcRenderer.invoke('request-backend', {
        oper: 'postMasterKey',
        data: { master_key }
    }),

    // CSV 파일 경로 설정
    setFilePath:        path => ipcRenderer.send('set-file-path', path),

    // 비밀번호 항목 생성 (oper="createPasswordEntry", data={ file_path, ...entry })
    createPasswordEntry:        data => ipcRenderer.invoke('createPasswordEntry', data),

    // 비밀번호 항목 수정 (oper="updatePasswordEntry", data={ file_path, ...updateData })
    updatePasswordEntry:        data => ipcRenderer.invoke('updatePasswordEntry', data),

    // 비밀번호 항목 삭제 (oper="deletePasswordEntry", data={ file_path, uid })
    // deletePasswordEntry:        uid  => ipcRenderer.invoke('deletePasswordEntry', { uid }),
    deletePasswordEntry: uid => ipcRenderer.invoke('deletePasswordEntry', { UID: uid }),

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

    // 검색된 비밀번호 조회 (oper="searchPasswordEntry")
    // searchPasswordEntry: (q) => ipcRenderer.invoke('search-password-entry', q),
    searchPasswordEntry:        query => ipcRenderer.invoke('searchPasswordEntry', { query }),

    // 비밀번호 상세 조회 (oper="getPasswordDetail", data={ UID })
    getPasswordDetail: args =>
        ipcRenderer.invoke('request-backend', {
            oper: 'getPasswordDetail',
            data: args
        }),

    getPasswordCount: ()       => ipcRenderer.invoke('get-password-count'),
    getStrongCount:   ()       => ipcRenderer.invoke('getStrongCount'),
    getNormalCount:   ()       => ipcRenderer.invoke('getNormalCount'),
    getWeakCount:     ()       => ipcRenderer.invoke('getWeakCount'),

    // 강도별 비밀번호 리스트 조회 (oper="getVulnerablePasswords", data: { type: 'strong'|'normal'|'weak', tag? })
    getVulnerablePasswords: args =>
        ipcRenderer.invoke('getVulnerablePasswords', args),

    // 강도별 비밀번호 개수 조회 (oper="getVulnerablePasswordCount", data: { type: 'strong'|'normal'|'weak', tag? })
    getVulnerablePasswordCount: args =>
        ipcRenderer.invoke('getVulnerablePasswordCount', args),

    // 재사용된 비밀번호 리스트 조회
    getReusedPasswords: () =>
        ipcRenderer.invoke('getReusedPasswords'),

    // 재사용된 비밀번호 개수 조회
    getReusedCount: () =>
        ipcRenderer.invoke('getReusedCount'),

    // 오래된 비밀번호 리스트 조회
    getOldPasswords: () =>
        ipcRenderer.invoke('getOldPasswords'),

    // 오래된 비밀번호 개수 조회
    getOldCount: () =>
        ipcRenderer.invoke('getOldCount'),

    // 유출된 비밀번호 리스트 조회
    getLeakedPasswords: () =>
        ipcRenderer.invoke('getLeakedPasswords'),

    // 유출된 비밀번호 개수 조회
    getLeakedCount: () =>
        ipcRenderer.invoke('getLeakedCount'),

    // 클립보드 쓰기 (30초 후 자동 삭제)
    writeClipboard: text => ipcRenderer.invoke('writeClipboard', text),

    // 태그별 PW 가져오기
    getPasswordsByTag: (tag) => ipcRenderer.invoke('getPasswordsByTag', { tag }),

    // ZKP 서버 연동
    zkpSignup: (username, password) => ipcRenderer.invoke('zkp:signup', { username, password }),
    zkpLogin: (username, password) => ipcRenderer.invoke('zkp:login', { username, password }),
    zkpUpload: () => ipcRenderer.invoke('zkp:upload'),
    zkpDownload: () => ipcRenderer.invoke('zkp:download'),

});
