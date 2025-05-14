const INACTIVITY_LIMIT = 5 * 60 * 1000;  // 초기값 5분 (5 * 60 * 1000)
let logoutTimer;

function clearSensitiveData() {
    if (window.sessionData) {
        window.sessionData.password = '';
        window.sessionData.token = '';
        window.sessionData = null;
    }

    localStorage.clear();
    sessionStorage.clear();

    if (window.cachedPasswords) {
        window.cachedPasswords = [];
    }

    console.log('[보안] 세션 만료로 민감 데이터 파기 완료'); // 확인용
}

function autoLogout() {
    clearSensitiveData();
    window.electronAPI.navigate('start');
}

function resetInactivityTimer() {
    clearTimeout(logoutTimer);
    logoutTimer = setTimeout(autoLogout, INACTIVITY_LIMIT);
}

const activityEvents = ['click', 'mousemove', 'keydown', 'scroll', 'touchstart'];

activityEvents.forEach(event => {
    window.addEventListener(event, () => {
        window.electronAPI.userActive?.();
        resetInactivityTimer();
    });
});

resetInactivityTimer();

//================================================================================

// 공통 사이드바 제어 스크립트 예시
function setActiveNav(page) {
    document.querySelectorAll('nav button').forEach(btn => {
        btn.classList.toggle('active', btn.id === `nav-${page}`);
    });
}

function goTo(page) {
    // 페이지 이동 로직 (기존)
    ipcRenderer.send('navigate', page);
    // active 토글
    setActiveNav(page);
}

// 초기 로딩 시에도 현재 페이지 강조
// 예: window.currentPage 변수를 서버나 렌더러에서 세팅해준 경우
setActiveNav(window.currentPage || 'home');