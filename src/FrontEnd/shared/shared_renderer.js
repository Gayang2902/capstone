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
// 1) 세션 만료(자동 로그아웃) 처리
// ─────────────────────────────────────────────────────────────
function clearSensitiveData() {
    // 전역에 저장된 민감 데이터를 모두 지워야 합니다.
    if (window.sessionData) {
        window.sessionData.password = '';
        window.sessionData.token = '';
        window.sessionData = null;
    }

    // 로컬/세션 스토리지도 모두 클리어
    localStorage.clear();
    sessionStorage.clear();

    // 메모리 캐시된 비밀번호 목록이 있다면 초기화
    if (window.cachedPasswords) {
        window.cachedPasswords = [];
    }
}

function autoLogout() {
    // 민감 데이터 클리어
    clearSensitiveData();

    // 메인 프로세스 쪽으로 저장소도 지우도록 요청
    window.electronAPI.clearBrowserStorage();

    // “start” 페이지로 이동
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
        // 메인 프로세스에 유저 활동 알림을 전달 (필요 시)
        window.electronAPI.userActive?.();
        resetInactivityTimer();
    });
});

// 앱 로드 시 첫 타이머 시작
resetInactivityTimer();

// ─────────────────────────────────────────────────────────────
// 3) 공통 네비게이션 제어 함수
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

//─────────────────────────────────────────────────────────────────────────
// === Generator 팝업 기능 추가 (아래 부분만 그대로) ===

// 슬라이더(pwdLength) 값이 바뀔 때마다 옆 숫자 업데이트
const pwdLength      = document.getElementById('pwdLength');
const pwdLengthValue = document.getElementById('pwdLengthValue');
pwdLength.addEventListener('input', () => {
    pwdLengthValue.textContent = pwdLength.value;
});

// 비밀번호 생성 로직 (예시: 필요에 맞게 수정 가능)
function simpleGeneratePassword(length, options) {
    const lower   = 'abcdefghijklmnopqrstuvwxyz';
    const upper   = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()-_=+[]{}|;:,.<>?';
    let pool = '';

    if (options.number)      pool += numbers;
    if (options.upper)       pool += upper;
    if (options.symbol)      pool += symbols;
    if (options.randomWord)  pool += 'secret'; // 예시 단어

    if (!pool) pool = lower + numbers + symbols + upper;

    let pwd = '';
    for (let i = 0; i < length; i++) {
        pwd += pool.charAt(Math.floor(Math.random() * pool.length));
    }
    return pwd;
}

// 강도 표시 로직 (예시: 필요에 맞게 수정 가능)
function updateStrength(password) {
    let score = 0;
    if (password.length > 8)          score += 1;
    if (/[A-Z]/.test(password))        score += 1;
    if (/[0-9]/.test(password))        score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    const percentages = [20, 40, 60, 80, 100];
    const texts       = ['매우 약함', '약함', '보통', '양호', '매우 양호'];
    const idx = Math.min(score, 4);

    const strengthBar  = document.getElementById('strengthBar');
    const strengthText = document.getElementById('strengthText');

    strengthBar.style.width = `${percentages[idx]}%`;
    strengthBar.className = `h-2 rounded ${
        idx < 2
            ? 'bg-red-500'
            : idx < 3
                ? 'bg-yellow-500'
                : idx < 4
                    ? 'bg-green-500'
                    : 'bg-indigo-600'
    }`;
    strengthText.textContent = texts[idx];
}

// “생성하기” 버튼 클릭 → 비밀번호 생성 + 강도 표시
const generateBtn       = document.getElementById('generateBtn');
const generatedPassword = document.getElementById('generatedPassword');
generateBtn.addEventListener('click', () => {
    const length  = parseInt(document.getElementById('pwdLength').value, 10);
    const options = {
        number:      document.getElementById('optionNumber').checked,
        upper:       document.getElementById('optionUpper').checked,
        symbol:      document.getElementById('optionSymbol').checked,
        randomWord:  document.getElementById('optionRandomWord').checked
        // 단어 기반(optionWord)이나 커스텀(optionCustom)은 필요에 맞게 추가 처리하세요.
    };

    const newPwd = simpleGeneratePassword(length, options);
    generatedPassword.value = newPwd;
    updateStrength(newPwd);
});

// 복사 버튼 클릭 → 클립보드 복사
const copyPasswordBtn = document.getElementById('copyPasswordBtn');
copyPasswordBtn.addEventListener('click', () => {
    const pwd = document.getElementById('generatedPassword').value;
    if (!pwd) return;
    navigator.clipboard.writeText(pwd).then(() => {
        alert('클립보드에 복사되었습니다.');
    });
});

// 새로고침 버튼 클릭 → 즉시 비밀번호 재생성
const refreshPasswordBtn = document.getElementById('refreshPasswordBtn');
refreshPasswordBtn.addEventListener('click', () => {
    generateBtn.click();
});

// “+” 버튼 클릭 → Generator 모달 열기
const openGeneratorBtn = document.getElementById('openGeneratorBtn');
openGeneratorBtn.addEventListener('click', () => {
    document.getElementById('generatorModal').classList.remove('hidden');
});

// 모달 닫기(x) 버튼 클릭 → Generator 모달 닫기
document.getElementById('generatorClose').addEventListener('click', () => {
    document.getElementById('generatorModal').classList.add('hidden');
});

// 모달 바깥 검은 영역 클릭 시에도 모달 닫기
document.getElementById('generatorModal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('generatorModal')) {
        document.getElementById('generatorModal').classList.add('hidden');
    }
});
//─────────────────────────────────────────────────────────────────────────
