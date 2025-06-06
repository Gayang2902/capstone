// File: pages/start/start_renderer.js

window.addEventListener('DOMContentLoaded', () => {
    const btnOpen   = document.getElementById('btn-open-file');
    const btnCreate = document.getElementById('btn-create-file');
    const btnAuth   = document.getElementById('btn-authenticate');
    const inputKey  = document.getElementById('input-master-key');
    const fileList  = document.getElementById('file-list');
    const statusMsg = document.getElementById('status-msg');

    let filePaths = [];
    let currentFileIndex = -1;

    // 1) 인증 버튼 초기 비활성화
    btnAuth.disabled = true;

    function renderFileList() {
        fileList.innerHTML = '';
        if (filePaths.length === 0) {
            const li = document.createElement('li');
            li.className = 'text-gray-500 italic';
            li.textContent = '선택된 파일이 없습니다.';
            fileList.append(li);
            currentFileIndex = -1;
            btnAuth.disabled = true;
            inputKey.value = '';
            return;
        }
        filePaths.forEach((fp, idx) => {
            const li = document.createElement('li');
            li.className = 'flex items-center justify-between p-2 rounded cursor-pointer hover:bg-blue-100';

            // (1) 파일 경로 텍스트
            const span = document.createElement('span');
            span.textContent = fp;
            span.className = (idx === currentFileIndex ? 'bg-blue-200 px-2 py-1 rounded' : '');
            li.append(span);

            // (2) 삭제 버튼
            const btnDel = document.createElement('button');
            btnDel.textContent = '삭제';
            btnDel.className = 'ml-2 px-2 py-1 bg-red-500 text-white rounded';
            btnDel.style.display = (idx === currentFileIndex ? 'inline-block' : 'none');
            btnDel.addEventListener('click', e => {
                e.stopPropagation();
                filePaths.splice(idx, 1);
                currentFileIndex = -1;
                renderFileList();
            });
            li.append(btnDel);

            // (3) 리스트 항목 클릭 시 “선택된 파일” 변경
            li.addEventListener('click', () => {
                currentFileIndex = idx;
                // 메인 프로세스로도 최신 파일 경로를 전송
                window.electronAPI.setFilePath(fp);
                inputKey.value = '';
                btnAuth.disabled = true;
                renderFileList();
                statusMsg.textContent = '';
            });

            fileList.append(li);
        });
    }

    // CSV 파일 열기
    btnOpen.addEventListener('click', async () => {
        const res = await window.electronAPI.openFile();
        if (res.status) {
            // 이미 목록에 있으면 중복 추가 방지
            if (!filePaths.includes(res.file_path)) {
                filePaths.push(res.file_path);
                window.electronAPI.setFilePath(res.file_path);
                console.log('▶ start_renderer: 파일 경로 전송 →', res.file_path);
                currentFileIndex = filePaths.length - 1;
                renderFileList();
                statusMsg.textContent = '';
            } else {
                statusMsg.textContent = '이미 선택된 파일입니다.';
            }
        } else {
            statusMsg.textContent = res.error_message;
        }
    });

    // 새 CSV 파일 생성
    btnCreate.addEventListener('click', async () => {
        const res = await window.electronAPI.createFile();
        if (res.status) {
            // 목록 초기화 후 새 파일 추가
            filePaths = [res.file_path];
            window.electronAPI.setFilePath(res.file_path);
            console.log('▶ start_renderer: 새 파일 경로 전송 →', res.file_path);
            currentFileIndex = 0;
            renderFileList();
            statusMsg.textContent = '신규 파일이 생성되어 목록이 초기화되었습니다.';
            inputKey.value = '';
            btnAuth.disabled = true;
        } else {
            statusMsg.textContent = res.error_message;
        }
    });

    // 마스터 키 입력 시 인증 버튼 활성/비활성
    inputKey.addEventListener('input', () => {
        btnAuth.disabled = (inputKey.value.trim() === '' || currentFileIndex < 0);
        statusMsg.textContent = '';
    });

    // 마스터 키 인증 요청
    btnAuth.addEventListener('click', async () => {
        const masterKey = inputKey.value.trim();
        console.log('▶ start_renderer: postMasterKey 호출 준비. masterKey=', masterKey);

        try {
            // oper="postMasterKey", data={ master_key: masterKey }
            const resp = await window.electronAPI.postMasterKey(masterKey);
            console.log('▶ start_renderer: postMasterKey 응답=', resp);

            if (resp.status) {
                // 인증 성공 시 홈 화면으로 이동
                statusMsg.textContent = '';
                window.electronAPI.navigate('home');
            } else {
                statusMsg.textContent = '인증 실패: ' + (resp.error_message || '알 수 없는 오류');
            }
        } catch (err) {
            console.error('▶ start_renderer: postMasterKey 예외 발생:', err);
            statusMsg.textContent = '인증 중 오류 발생: ' + err.message;
        }
    });

    // 초기 렌더링
    renderFileList();
});