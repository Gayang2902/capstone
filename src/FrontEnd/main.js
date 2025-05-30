// ────────────────────────────────────────────────────────────────────────────────
// src/main.js                                                                  │
// 역할: Electron 메인 프로세스 진입점, BrowserWindow 및 BrowserView 관리,        │
//      IPC 메시지로 페이지 전환 처리                                            │
// ────────────────────────────────────────────────────────────────────────────────

// ─── 모듈 불러오기 시작 ───
const { app, BrowserWindow, BrowserView, ipcMain } = require('electron'); // Electron 주요 API
const path = require('path');                                              // 파일 경로 처리 모듈
// ─── 모듈 불러오기 끝 ───


let mainWindow;   // 메인 윈도우 참조
let statsView;    // Statistics 페이지용 BrowserView
let groupView;    // Group 페이지용 BrowserView
let settingView;  // Setting 페이지용 BrowserView


// ─── createWindow 함수 정의 시작 ───
// 역할: 앱 초기화 시 메인 윈도우 및 각 BrowserView 생성, IPC 리스너 등록
function createWindow() {
  //  메인 윈도우 생성
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // 프리로드 스크립트
      contextIsolation: true,                      // 렌더러와 분리
      nodeIntegration: false                       // 노드 통합 비활성화
    }
  });

  // ─── ① 처음에 Home 페이지 로드 ───
  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));

  // ─── ② Statistics용 BrowserView 생성 & 미리 로드 ───
  statsView = new BrowserView({
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true
    }
  });
  statsView.setAutoResize({ width: true, height: true });
  statsView.webContents.loadFile(
    path.join(__dirname, 'src', 'statistics', 'index.html')
  );

  // ─── ③ Group용 BrowserView 생성 & 미리 로드 ───
  groupView = new BrowserView({
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true
    }
  });
  groupView.setAutoResize({ width: true, height: true });
  groupView.webContents.loadFile(
    path.join(__dirname, 'src', 'group', 'group.html')
  );

  // ─── ④ Setting용 BrowserView 생성 & 미리 로드 ───
  settingView = new BrowserView({
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true
    }
  });
  settingView.setAutoResize({ width: true, height: true });
  settingView.webContents.loadFile(
    path.join(__dirname, 'src', 'setting', 'setting.html')
  );

  // ─── ⑤ IPC로 뷰 전환 처리 ───
  // renderer 프로세스에서 'navigate' 이벤트 수신 후 해당 BrowserView를 메인 윈도우에 설정
  ipcMain.on('navigate', (_, page) => {
    // 윈도우 내부 크기 가져오기
    const [w, h] = mainWindow.getContentSize();
    // 사이드바(200px) 제외한 콘텐츠 영역 좌표 설정
    const bounds = { x: 200, y: 0, width: w - 200, height: h };

    if (page === 'statistics') {
      mainWindow.setBrowserView(statsView);
      statsView.setBounds(bounds);
    } else if (page === 'group') {
      mainWindow.setBrowserView(groupView);
      groupView.setBounds(bounds);
    } else if (page === 'setting') {
      mainWindow.setBrowserView(settingView);
      settingView.setBounds(bounds);
    } else if (page === 'home') {
      // Home은 BrowserView 없이 index.html 자체를 보여 줌
      mainWindow.setBrowserView(null);
    }
  });
}
// ─── createWindow 함수 정의 끝 ───


// ─── 앱 이벤트 리스너 등록 ───
// 앱이 준비되면 createWindow 호출
app.whenReady().then(createWindow);
// 모든 창이 닫히면 앱 종료 (macOS 제외)
app.on('window-all-closed', () => app.quit());
// ─── 앱 이벤트 리스너 끝 ───
