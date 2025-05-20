// pages/start/start_renderer.js

let selectedPasswordFile = null; // 선택된 비밀번호 파일 경로
let selectedElement = null;      // 선택된 파일을 강조할 DOM 요소

const list = document.getElementById('recent-files');           // 최근 파일 목록 <ul>
const openBtn = document.getElementById('open-password-file');  // 기존 파일 열기 버튼
const createBtn = document.getElementById('create-password-file'); // 새 파일 만들기 버튼
const connectBtn = document.getElementById('connect-btn');      // Home으로 이동 버튼

// 모달 요소들
const createModal   = document.getElementById('createMasterModal');
const createInput   = document.getElementById('create-master-input');
const createSave    = document.getElementById('create-master-save');
const createCancel  = document.getElementById('create-master-cancel');

const enterModal    = document.getElementById('enterMasterModal');
const enterInput    = document.getElementById('enter-master-input');
const enterSubmit   = document.getElementById('enter-master-submit');
const enterCancel   = document.getElementById('enter-master-cancel');

// --------------------------------------------------
// 1) 기존 파일 열기
openBtn?.addEventListener('click', async () => {
    const file = await window.electronAPI.openFile();
    if (file) {
        selectedPasswordFile = file;
        alert(`파일 선택됨: ${file}`);
        await loadRecentFiles();
    }
});

// 2) 새 파일 만들기
createBtn?.addEventListener('click', async () => {
    const file = await window.electronAPI.createFile();
    if (file) {
        selectedPasswordFile = file;
        alert(`새 파일 생성됨: ${file}`);
        await loadRecentFiles();
    }
});

// 3) (원본) 로그인 버튼
document.getElementById('login-btn')?.addEventListener('click', async () => {
    const password = document.getElementById('password').value;
    if (!selectedPasswordFile) {
        return alert('먼저 파일을 선택해주세요!');
    }
    if (!password) {
        return alert('비밀번호를 입력해주세요!');
    }

    const storedPassword = await window.electronAPI.readMasterPassword(selectedPasswordFile);
    if (storedPassword === password) {
        await window.electronAPI.setCurrentFile(selectedPasswordFile);
        window.electronAPI.navigate('home');
    } else {
        alert('비밀번호가 일치하지 않습니다.');
    }
});

// 4) (원본) 마스터 비밀번호 설정 버튼
document.getElementById('set-master-password')?.addEventListener('click', async () => {
    const pw = document.getElementById('master-password-input').value;
    if (!selectedPasswordFile) {
        return alert('파일을 먼저 선택해주세요!');
    }
    if (!pw) {
        return alert('비밀번호를 입력해주세요!');
    }
    const success = await window.electronAPI.setMasterPassword(selectedPasswordFile, pw);
    if (success) {
        alert('비밀번호가 저장되었습니다.');
        document.getElementById('master-password-input').value = '';
    } else {
        alert('파일 저장에 실패했습니다.');
    }
});

// --------------------------------------------------
// 5) 확장된 loadRecentFiles: 삭제 버튼 & Connect 활성화
async function loadRecentFiles() {
    const files = await window.electronAPI.getRecentFiles();
    list.innerHTML = '';
    connectBtn.disabled = true;  // 목록 로딩할 때 비활성화

    files.forEach(f => {
        const li = document.createElement('li');
        li.textContent = f.split(/[\\/]/).pop();
        li.classList.add('file-item');

        // 클릭 시 선택 효과 + 삭제 버튼 붙이기
        li.addEventListener('click', () => {
            // 1) 선택 표시
            document.querySelectorAll('#recent-files li').forEach(el => el.classList.remove('selected'));
            document.querySelectorAll('.delete-btn').forEach(btn => btn.remove());

            li.classList.add('selected');
            selectedElement = li;
            selectedPasswordFile = f;
            connectBtn.disabled = false;

            // 2) 삭제 버튼 생성
            const del = document.createElement('button');
            del.textContent = 'Delete';
            del.className = 'delete-btn';
            del.addEventListener('click', async e => {
                e.stopPropagation();
                await window.electronAPI.removeFromRecent(f);
                await loadRecentFiles();
            });
            li.appendChild(del);
        });

        list.appendChild(li);
    });
}

// 6) Connect 버튼: 마스터 비밀번호 생성 vs 입력 분기
connectBtn.addEventListener('click', async () => {
    if (!selectedPasswordFile) return;
    const stored = await window.electronAPI.readMasterPassword(selectedPasswordFile);

    if (!stored) {
        // 비밀번호 미생성 → 생성 모달
        createInput.value = '';
        createModal.style.display = 'flex';
    } else {
        // 이미 생성됨 → 입력 모달
        enterInput.value = '';
        enterModal.style.display = 'flex';
    }
});

// 7) 생성 모달: 취소/저장 핸들러
createCancel.addEventListener('click', () => createModal.style.display = 'none');
createSave.addEventListener('click', async () => {
    const pw = createInput.value.trim();
    if (!pw) return alert('새 비밀번호를 입력해주세요');
    await window.electronAPI.setMasterPassword(selectedPasswordFile, pw);
    createModal.style.display = 'none';
    await window.electronAPI.setCurrentPasswordFile(selectedPasswordFile); // 수정
    window.electronAPI.navigate('home');
});

// 8) 입력 모달: 취소/검증 핸들러
enterCancel.addEventListener('click', () => enterModal.style.display = 'none');
enterSubmit.addEventListener('click', async () => {
    const pw = enterInput.value.trim();
    if (!pw) return alert('비밀번호를 입력해주세요');
    const stored = await window.electronAPI.readMasterPassword(selectedPasswordFile);
    if (pw === stored) {
        enterModal.style.display = 'none';
        await window.electronAPI.setCurrentPasswordFile(selectedPasswordFile); // 수정
        window.electronAPI.navigate('home');
    } else {
        alert('비밀번호가 일치하지 않습니다');
    }
});

// 9) 초기 로드
loadRecentFiles();
