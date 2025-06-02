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

    function renderFileList() {
        fileList.innerHTML = '';
        if (filePaths.length === 0) {
            const li = document.createElement('li');
            li.className = 'text-gray-500 italic';
            li.textContent = '선택된 파일이 없습니다.';
            fileList.append(li);
            currentFileIndex = -1;
            btnAuth.disabled = true;
            return;
        }
        filePaths.forEach((fp, idx) => {
            const li = document.createElement('li');
            li.className = 'flex items-center justify-between p-2 rounded cursor-pointer hover:bg-blue-100';

            const span = document.createElement('span');
            span.textContent = fp;
            span.className = idx === currentFileIndex ? 'bg-blue-200 px-2 py-1 rounded' : '';
            li.append(span);

            const btnDel = document.createElement('button');
            btnDel.textContent = '삭제';
            btnDel.className = 'ml-2 px-2 py-1 bg-red-500 text-white rounded';
            btnDel.style.display = idx === currentFileIndex ? 'inline-block' : 'none';
            btnDel.addEventListener('click', e => {
                e.stopPropagation();
                filePaths.splice(idx, 1);
                currentFileIndex = -1;
                renderFileList();
            });
            li.append(btnDel);

            li.addEventListener('click', () => {
                currentFileIndex = idx;
                renderFileList();
                btnAuth.disabled = inputKey.value.trim() === '';
                statusMsg.textContent = '';
            });

            fileList.append(li);
        });
    }

    // CSV 파일 열기
    btnOpen.addEventListener('click', async () => {
        const res = await window.electronAPI.openFile();
        if (res.status) {
            filePaths.push(res.file_path);
            window.electronAPI.setFilePath(res.file_path);
            console.log('DEBUG: start_renderer sent file path to main:', res.file_path);
            currentFileIndex = filePaths.length - 1;
            renderFileList();
            statusMsg.textContent = '';
        } else {
            statusMsg.textContent = res.error_message;
        }
    });

    // 새 CSV 파일 생성
    btnCreate.addEventListener('click', async () => {
        const res = await window.electronAPI.createFile();
        if (res.status) {
            filePaths = [res.file_path];
            window.electronAPI.setFilePath(res.file_path);
            console.log('DEBUG: start_renderer created and sent file path to main:', res.file_path);
            currentFileIndex = 0;
            renderFileList();
            statusMsg.textContent = '';
        } else {
            statusMsg.textContent = res.error_message;
        }
    });

    // 마스터 키 입력 시 인증 버튼 활성화
    inputKey.addEventListener('input', () => {
        btnAuth.disabled = inputKey.value.trim() === '' || currentFileIndex < 0;
        statusMsg.textContent = '';
    });

    // 마스터 키 인증 요청
    btnAuth.addEventListener('click', async () => {
        const key  = inputKey.value.trim();
        const path = filePaths[currentFileIndex];
        const res  = await window.electronAPI.postMasterKey(key, path);
        if (res.status) {
            window.electronAPI.navigate('home');
        } else {
            statusMsg.textContent = '인증 실패: ' + res.error_message;
        }
    });

    // 초기 렌더링
    renderFileList();
});