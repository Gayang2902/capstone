// File: src/pages/setting/setting_renderer.js

document.addEventListener('DOMContentLoaded', () => {
    // ── 1) 스크린샷 방지 토글 ──
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

    // ── 2) DB 경로 표시 (Start 페이지에서 선택된 파일) ──
    const dbInput = document.getElementById('dbPathInput');
    window.electronAPI.getFilePath()
        .then(res => {
            if (res.status && res.file_path) {
                dbInput.value = res.file_path;
            } else {
                console.error('getFilePath 오류:', res.error_message);
                dbInput.value = '경로 불러오기 실패';
            }
        })
        .catch(err => console.error('getFilePath 호출 오류:', err));

    // ── 3) 자동 잠금 설정 ──
    const select = document.getElementById('autoLockSelect');
    const saved = localStorage.getItem('autoLockMinutes');
    if (saved && select.querySelector(`option[value="${saved}"]`)) {
        select.value = saved;
    } else {
        localStorage.setItem('autoLockMinutes', '5');
    }
    select.addEventListener('change', () => {
        const minutes = select.value;
        localStorage.setItem('autoLockMinutes', minutes);
        if (typeof resetInactivityTimer === 'function') {
            resetInactivityTimer();
        }
    });

    // ── 4) 마스터 비밀번호 보기/숨기기 토글 ──
    const oldMasterInput    = document.getElementById('oldMasterInput');
    const toggleOldMasterBtn = document.getElementById('toggleOldMasterBtn');
    const oldMasterIcon     = document.getElementById('oldMasterIcon');
    if (oldMasterInput && toggleOldMasterBtn && oldMasterIcon) {
        let hidden = true;
        toggleOldMasterBtn.addEventListener('click', () => {
            hidden = !hidden;
            oldMasterInput.type = hidden ? 'password' : 'text';
            oldMasterIcon.classList.toggle('fa-eye');
            oldMasterIcon.classList.toggle('fa-eye-slash');
        });
    }

    const newMasterInput    = document.getElementById('newMasterInput');
    const toggleNewMasterBtn = document.getElementById('toggleNewMasterBtn');
    const newMasterIcon     = document.getElementById('newMasterIcon');
    if (newMasterInput && toggleNewMasterBtn && newMasterIcon) {
        let hidden = true;
        toggleNewMasterBtn.addEventListener('click', () => {
            hidden = !hidden;
            newMasterInput.type = hidden ? 'password' : 'text';
            newMasterIcon.classList.toggle('fa-eye');
            newMasterIcon.classList.toggle('fa-eye-slash');
        });
    }

    // ── 5) 마스터 비밀번호 변경 처리 ──
    const changeBtn = document.getElementById('changeMasterBtn');
    const messageEl = document.getElementById('settingMessage');
    changeBtn?.addEventListener('click', async () => {
        const oldPwd = oldMasterInput.value.trim();
        const newPwd = newMasterInput.value.trim();
        messageEl.textContent = '';
        messageEl.className = 'mt-2 text-sm';

        if (!oldPwd) {
            messageEl.textContent = '기존 마스터 비밀번호를 입력해주세요.';
            messageEl.classList.add('text-red-600');
            return;
        }
        if (!newPwd) {
            messageEl.textContent = '새 마스터 비밀번호를 입력해주세요.';
            messageEl.classList.add('text-red-600');
            return;
        }

        try {
            const res = await window.electronAPI.updateMasterKey(oldPwd, newPwd);
            if (res.status) {
                messageEl.textContent = '마스터 비밀번호가 성공적으로 변경되었습니다.';
                messageEl.classList.add('text-green-600');
                oldMasterInput.value = '';
                newMasterInput.value = '';
                // 보기 토글 초기화
                if (oldMasterInput.type === 'text') toggleOldMasterBtn.click();
                if (newMasterInput.type === 'text') toggleNewMasterBtn.click();
            } else {
                throw new Error(res.error_message || '변경 실패');
            }
        } catch (err) {
            console.error('updateMasterKey 오류:', err);
            messageEl.textContent = `오류: ${err.message}`;
            messageEl.classList.add('text-red-600');
        }
    });

    // ── 6) CSV 내보내기 ──
    const exportBtn = document.getElementById('btnExportCsv');
    exportBtn?.addEventListener('click', async () => {
        // "모든 비밀번호" 내보내기 호출
        const res = await window.electronAPI.exportCsv();
        // if (res.status) {
        //     alert(`내보내기 완료:\n${res.file_path}`);
        // } else {
        //     alert(`내보내기 오류: ${res.error_message}`);
        // }
    });
});