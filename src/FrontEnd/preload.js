// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    //페이지 이동
    navigate:         page => ipcRenderer.send('navigate', page),

    // 스크린샷 허용 / 방지
    preventScreenshot:()   => ipcRenderer.send('prevent-screenshot'),
    allowScreenshot:  ()   => ipcRenderer.send('allow-screenshot'),

    // 사용자 활동 감지
    userActive:       ()   => ipcRenderer.send('user-active'),

    // 백엔드 API 호출: oper 이름과 data 객체를 넘겨줌
    invokeOper:       (op, data) => ipcRenderer.invoke('invoke-oper', { oper: op, data })
});