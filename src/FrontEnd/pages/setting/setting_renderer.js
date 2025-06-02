// File: pages/setting/setting_renderer.js

(function() {
    // 1) 스크린샷 방지 토글
    const btnSnap = document.getElementById('btnScreenshotPrevent');
    let blocked = true;
    window.electronAPI.preventScreenshot();
    btnSnap?.addEventListener('click', () => {
        blocked = !blocked;
        if (blocked) {
            window.electronAPI.preventScreenshot();
            btnSnap.title = '스크린샷 방지';
            btnSnap.innerHTML = `<i class="fa-solid fa-shield-halved text-indigo-700 text-lg"></i>`;
        } else {
            window.electronAPI.allowScreenshot();
            btnSnap.title = '스크린샷 허용';
            btnSnap.innerHTML = `<i class="fa-solid fa-shield text-gray-600 text-lg"></i>`;
        }
    });

    // 2) Start 페이지에서 선택한 “DB 경로” 가져와서 Input에 채워주기
    const dbInput = document.getElementById('dbPathInput');
    window.electronAPI.getFilePath()
        .then(res => {
            if (res.status && res.file_path) {
                dbInput.value = res.file_path;
            }
        })
        .catch(err => {
            console.error('DB 경로를 가져오는 중 오류:', err);
        });

    // 3) “자동 잠금” 드롭다운 설정 로드 및 변경 처리
    const select = document.getElementById('autoLockSelect');

    // (a) “테스트용 3초” 옵션 추가 (value="0.05" → 0.05분 = 3초)
    const testOption = document.createElement('option');
    testOption.value = '0.05';
    testOption.textContent = '3초 테스트';
    select.appendChild(testOption);

    // (b) 이전에 저장된 값이 있으면 select.value 초기화, 없으면 기본 5분 세팅
    const saved = localStorage.getItem('autoLockMinutes');
    if (saved && select.querySelector(`option[value="${saved}"]`)) {
        select.value = saved;
    } else {
        // 로컬 스토리지 값이 없으면 기본 5분(= "5")로 설정
        localStorage.setItem('autoLockMinutes', '5');
        select.value = '5';
    }

    // (c) select.value가 정해진 시점에 타이머 리셋 호출
    //      (shared_renderer.js 쪽의 resetInactivityTimer 함수를 실행)
    if (typeof resetInactivityTimer === 'function') {
        resetInactivityTimer();
    }

    // (d) 드롭다운 변경 시 처리
    select.addEventListener('change', () => {
        const minutes = select.value;
        localStorage.setItem('autoLockMinutes', minutes);

        if (typeof resetInactivityTimer === 'function') {
            resetInactivityTimer();
        }
    });
})();