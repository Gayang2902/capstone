// File: pages/setting/setting_renderer.js

document.addEventListener('DOMContentLoaded', () => {
    // ───────────────────────────────────────────────────────────
    // 1) 스크린샷 방지 토글
    // ───────────────────────────────────────────────────────────
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

    // ───────────────────────────────────────────────────────────
    // 2) Start 페이지에서 선택한 “DB 경로” 가져와서 Input에 채워주기
    // ───────────────────────────────────────────────────────────
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

    // ───────────────────────────────────────────────────────────
    // 3) “자동 잠금” 드롭다운 설정 로드 및 변경 처리
    // ───────────────────────────────────────────────────────────
    const select = document.getElementById('autoLockSelect');
    // 이전에 저장된 값이 있으면 초기화
    const saved = localStorage.getItem('autoLockMinutes');
    if (saved && select.querySelector(`option[value="${saved}"]`)) {
        select.value = saved;
    } else if (!saved) {
        localStorage.setItem('autoLockMinutes', '5');
    }
    // 값 변경 시 로컬스토리지에 저장 및 타이머 리셋
    select.addEventListener('change', () => {
        const minutes = select.value;
        localStorage.setItem('autoLockMinutes', minutes);
        if (typeof resetInactivityTimer === 'function') {
            resetInactivityTimer();
        }
    });

    // ───────────────────────────────────────────────────────────
    // 4) “마스터 비밀번호 입력” 토글 및 변경 버튼 이벤트 연결
    // ───────────────────────────────────────────────────────────
    const oldMasterInput   = document.getElementById('oldMasterInput');
    const toggleOldMasterBtn  = document.getElementById('toggleOldMasterBtn');
    const oldMasterIcon    = document.getElementById('oldMasterIcon');

    const newMasterInput   = document.getElementById('newMasterInput');
    const toggleNewMasterBtn  = document.getElementById('toggleNewMasterBtn');
    const newMasterIcon    = document.getElementById('newMasterIcon');

    const changeMasterBtn  = document.getElementById('changeMasterBtn');

    // (1) 기존 비밀번호 토글
    if (oldMasterInput && toggleOldMasterBtn && oldMasterIcon) {
        let maskedOld = true;
        toggleOldMasterBtn.addEventListener('click', () => {
            maskedOld = !maskedOld;
            if (maskedOld) {
                oldMasterInput.setAttribute('type', 'password');
                oldMasterIcon.classList.remove('fa-eye');
                oldMasterIcon.classList.add('fa-eye-slash');
            } else {
                oldMasterInput.setAttribute('type', 'text');
                oldMasterIcon.classList.remove('fa-eye-slash');
                oldMasterIcon.classList.add('fa-eye');
            }
        });
    }

    // (2) 새 비밀번호 토글
    if (newMasterInput && toggleNewMasterBtn && newMasterIcon) {
        let maskedNew = true;
        toggleNewMasterBtn.addEventListener('click', () => {
            maskedNew = !maskedNew;
            if (maskedNew) {
                newMasterInput.setAttribute('type', 'password');
                newMasterIcon.classList.remove('fa-eye');
                newMasterIcon.classList.add('fa-eye-slash');
            } else {
                newMasterInput.setAttribute('type', 'text');
                newMasterIcon.classList.remove('fa-eye-slash');
                newMasterIcon.classList.add('fa-eye');
            }
        });
    }

    // (3) “변경” 버튼 클릭 처리
    changeMasterBtn?.addEventListener('click', async () => {
        const oldPwd = oldMasterInput.value.trim();
        const newPwd = newMasterInput.value.trim();

        if (!oldPwd) {
            alert('기존 마스터 비밀번호를 입력해주세요.');
            return;
        }
        if (!newPwd) {
            alert('새 마스터 비밀번호를 입력해주세요.');
            return;
        }

        // IPC로 메인 프로세스에 전달
        try {
            // 현재 설정된 DB 경로를 함께 전달
            const filePath = dbInput.value;
            const res = await window.electronAPI.updateMasterKey(oldPwd, newPwd, filePath);
            if (!res.status) {
                alert('변경 중 오류가 발생했습니다: ' + (res.error_message || '알 수 없는 오류'));
                return;
            }
            alert('마스터 비밀번호가 성공적으로 변경되었습니다.');
            oldMasterInput.value = '';
            newMasterInput.value = '';
            // 마스킹 상태로 되돌리기
            if (oldMasterInput.getAttribute('type') !== 'password') {
                oldMasterInput.setAttribute('type', 'password');
                oldMasterIcon.classList.remove('fa-eye');
                oldMasterIcon.classList.add('fa-eye-slash');
            }
            if (newMasterInput.getAttribute('type') !== 'password') {
                newMasterInput.setAttribute('type', 'password');
                newMasterIcon.classList.remove('fa-eye');
                newMasterIcon.classList.add('fa-eye-slash');
            }
        } catch (err) {
            console.error('updateMasterKey 호출 중 오류:', err);
            alert('변경 중 오류가 발생했습니다.');
        }
    });
});