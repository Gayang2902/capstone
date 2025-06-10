// main.js

const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      // 노드 통합을 켜서, 렌더러(fetch) 로직이 문제없이 동작하게 합니다.
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // src/index.html만 띄웁니다.
  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));

  // (옵션) 기본 메뉴를 숨기려면 아래 줄을 활성화하세요.
  Menu.setApplicationMenu(null);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  // macOS가 아니면 모든 윈도우 닫힐 때 앱을 종료
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // macOS: Dock 아이콘 클릭 시 윈도우가 하나도 없으면 새로 생성
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

