let selectedPasswordFile = null; // 선택된 비밀번호 파일 경로
let selectedElement = null; // 선택된 파일을 강조할 DOM 요소

const list = document.getElementById('recent-files'); // 최근 파일 목록을 표시할 <ul> 요소

// 기존 파일 열기 버튼
document.getElementById('open-password-file')?.addEventListener('click', async () => {
    // 파일 선택 대화상자 띄우기
    const file = await window.electronAPI.openFile();
    if (file) {
        selectedPasswordFile = file;
        alert(`파일 선택됨: ${file}`);
        await loadRecentFiles(); // 선택 후 최근 파일 목록 갱신
    }
});

// 새 파일 만들기 버튼
document.getElementById('create-password-file')?.addEventListener('click', async () => {
    // 새 파일 만들기 대화상자 띄우기
    const file = await window.electronAPI.createFile();
    if (file) {
        selectedPasswordFile = file;
        alert('새 파일 생성됨: ' + file);
        await loadRecentFiles(); // 생성 후 최근 파일 목록 갱신
    }
});

// 로그인 버튼
document.getElementById('login-btn')?.addEventListener('click', async () => {
    const password = document.getElementById('password').value; // 입력된 비밀번호

    // 파일 선택 여부 확인
    if (!selectedPasswordFile) {
        alert('먼저 파일을 선택해주세요!');
        return;
    }

    // 비밀번호 입력 여부 확인
    if (!password) {
        alert('비밀번호를 입력해주세요!');
        return;
    }

    // 저장된 마스터 비밀번호 불러와서 검증
    const storedPassword = await window.electronAPI.readMasterPassword(selectedPasswordFile);
    if (storedPassword === password) {
        await window.electronAPI.setCurrentPasswordFile(selectedPasswordFile); // 파일 경로 설정
        window.electronAPI.navigate('home'); // 홈으로 이동
    } else {
        alert('비밀번호가 일치하지 않습니다.');
    }
});

// 마스터 비밀번호 설정
document.getElementById('set-master-password')?.addEventListener('click', async () => {
    const pw = document.getElementById('master-password-input').value; // 새 비밀번호 입력

    // 파일 선택 여부 확인
    if (!selectedPasswordFile) {
        alert('파일을 먼저 선택해주세요!');
        return;
    }
    // 비밀번호 입력 여부 확인
    if (!pw) {
        alert('비밀번호를 입력해주세요!');
        return;
    }

    // 비밀번호 설정
    const success = await window.electronAPI.setMasterPassword(selectedPasswordFile, pw);
    if (success) {
        alert('비밀번호가 저장되었습니다.');
        document.getElementById('master-password-input').value = ''; // 입력 필드 초기화
    } else {
        alert('파일 저장에 실패했습니다.');
    }
});

// 최근 파일 목록
async function loadRecentFiles() {
    const files = await window.electronAPI.getRecentFiles();
    list.innerHTML = '';

    files.forEach(f => {
        const li = document.createElement('li');
        li.textContent = f;
        li.classList.add('file-item');

        // 선택 처리
        li.addEventListener('click', () => {
            if (selectedElement) selectedElement.classList.remove('selected');
            li.classList.add('selected');
            selectedElement = li;
            selectedPasswordFile = f;
        });

        // 삭제 버튼
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '🗑';
        deleteBtn.style.marginLeft = '10px';
        deleteBtn.addEventListener('click', async (e) => {
            e.stopPropagation(); // 클릭 이벤트 겹침 방지
            if (confirm('최근 파일 목록에서 제거하시겠습니까?')) {
                const success = await window.electronAPI.removeFromRecent(f);
                if (success) {
                    await loadRecentFiles(); // 다시 렌더링
                } else {
                    alert('목록에서 제거 실패');
                }
            }
        });

        li.appendChild(deleteBtn);
        list.appendChild(li);
    });
}

// 페이지 로드 시 최근 파일 목록 로드
loadRecentFiles();


// start -> home 페이지로 파일 경로 전달

const openFileBtn = document.getElementById('openFileBtn');

openFileBtn.addEventListener('click', async () => {
    const filePath = await window.electronAPI.openFile(); // 사용자 파일 선택
    if (filePath) {
        window.electronAPI.setCurrentFile(filePath); // 선택한 파일을 main에 저장
        window.electronAPI.navigate('home'); // home 페이지로 이동
    }
});