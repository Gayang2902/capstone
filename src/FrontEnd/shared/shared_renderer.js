const INACTIVITY_LIMIT = 5 * 60 * 1000;  // 초기값 5분
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