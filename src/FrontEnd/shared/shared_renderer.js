// File: shared_renderer.js

// ─────────────────────────────────────────────────────────────
// 0) 사용자 지정 타이머 값을 로컬 스토리지에서 읽어오는 헬퍼
// ─────────────────────────────────────────────────────────────
function getInactivityLimit() {
    // 로컬 스토리지에 저장된 값(분 단위)을 읽어서 밀리초로 변환
    // 예: "5" → 5 * 60 * 1000
    // "0.05" 는 0.05분 → 0.05 * 60 * 1000 = 3000ms (3초)
    const minutes = parseFloat(localStorage.getItem('autoLockMinutes') || '5');
    return minutes * 60 * 1000;
}

let logoutTimer;

// ─────────────────────────────────────────────────────────────
// 1) 앱 잠금 로직
// ─────────────────────────────────────────────────────────────
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
}

function autoLogout() {
    clearSensitiveData();
    window.electronAPI.navigate('start');
}

function resetInactivityTimer() {
    clearTimeout(logoutTimer);
    const limit = getInactivityLimit();
    logoutTimer = setTimeout(autoLogout, limit);
}

// ─────────────────────────────────────────────────────────────
// 2) 사용자 활동이 감지되면 타이머 리셋
// ─────────────────────────────────────────────────────────────
const activityEvents = ['click', 'mousemove', 'keydown', 'scroll', 'touchstart'];
activityEvents.forEach(eventName => {
    window.addEventListener(eventName, () => {
        window.electronAPI.userActive?.();
        resetInactivityTimer();
    });
});

// 앱 로드 시 첫 타이머 시작
resetInactivityTimer();

// ─────────────────────────────────────────────────────────────
// 3) 공통 사이드바 제어 함수
// ─────────────────────────────────────────────────────────────
function setActiveNav(page) {
    document.querySelectorAll('nav button').forEach(btn => {
        btn.classList.toggle('active', btn.id === `nav-${page}`);
    });
}

function goTo(page) {
    window.electronAPI.navigate(page);
    setActiveNav(page);
}

// 초기 로딩 시 강조할 버튼
setActiveNav(window.currentPage || 'home');

// ─────────────────────────────────────────────────────────────
// 4) 스크린샷 방지 토글
// ─────────────────────────────────────────────────────────────
const SCREENSHOT_BTN_SELECTOR = '#btnScreenshotPrevent';
let screenshotBlocked = true;

function initScreenshotToggle() {
    const toggleBtn = document.querySelector(SCREENSHOT_BTN_SELECTOR);
    if (!toggleBtn) return;

    // 기본: 방지 모드 ON
    window.electronAPI.preventScreenshot();
    toggleBtn.innerHTML = `<i class="fa-solid fa-shield-halved text-indigo-700 text-lg"></i>`;
    toggleBtn.title = '스크린샷 방지';

    toggleBtn.addEventListener('click', () => {
        screenshotBlocked = !screenshotBlocked;
        if (screenshotBlocked) {
            window.electronAPI.preventScreenshot();
            toggleBtn.title = '스크린샷 방지';
            toggleBtn.innerHTML = `<i class="fa-solid fa-shield-halved text-indigo-700 text-lg"></i>`;
        } else {
            window.electronAPI.allowScreenshot();
            toggleBtn.title = '스크린샷 허용';
            toggleBtn.innerHTML = `<i class="fa-solid fa-shield text-gray-600 text-lg"></i>`;
        }
    });
}

document.addEventListener('DOMContentLoaded', initScreenshotToggle);

// ─────────────────────────────────────────────────────────────
// 5) 데이터 페이지 하이라이트 (공통)
// ─────────────────────────────────────────────────────────────
function capitalizeFirstLetter(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

window.addEventListener('DOMContentLoaded', () => {
    const current = document.body.dataset.page;
    if (!current) return;
    const btn = document.getElementById('nav' + capitalizeFirstLetter(current));
    if (btn) {
        btn.classList.add('bg-blue-100', 'text-blue-800', 'shadow-lg');
    }
});