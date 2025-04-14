// 페이지 이동
function goTo(page) {
    if (entries.length > 0) {
        savePasswords(entries);
    }
    window.electronAPI.navigate(page);
}

// 스크린샷 방지 토글
let screenshotBlocked = false;
const toggleBtn = document.getElementById('screenshot-toggle');

toggleBtn.addEventListener('click', () => {
    screenshotBlocked = !screenshotBlocked;
    toggleBtn.innerText = screenshotBlocked ? '스크린샷 방지' : '스크린샷 허용';
    screenshotBlocked ? window.electronAPI.preventScreenshot() : window.electronAPI.allowScreenshot();
});

// 팝업 관련
const addEntryBtn = document.getElementById('addEntryBtn');
const popup = document.getElementById('popup');
const saveBtn = document.getElementById('saveBtn');
const cancelBtn = document.getElementById('cancelBtn');

// 입력 필드
const titleInput = document.getElementById('titleInput');
const urlInput = document.getElementById('urlInput');
const idInput = document.getElementById('idInput');
const pwInput = document.getElementById('pwInput');
const tagInput = document.getElementById('tagInput');
const entryTable = document.getElementById('entryTable').querySelector('tbody');
const searchInput = document.getElementById('searchInput');

let entries = [];
let editIndex = null; // 수정 중인 인덱스

addEntryBtn.addEventListener('click', () => {
    editIndex = null;
    popup.style.display = 'block';
});

cancelBtn.addEventListener('click', () => {
    popup.style.display = 'none';
    clearInputs();
});

saveBtn.addEventListener('click', async () => {
    const title = titleInput.value;
    const url = urlInput.value;
    const id = idInput.value;
    const pw = pwInput.value;
    const tag = tagInput.value;
    const faviconUrl = await getFavicon(url);

    const newEntry = { title, url, id, pw, tag, icon: faviconUrl };

    if (editIndex !== null) {
        entries[editIndex] = newEntry;
        editIndex = null;
    } else {
        entries.push(newEntry);
    }

    renderTable();
    popup.style.display = 'none';
    clearInputs();
    savePasswords(entries);
});

function clearInputs() {
    titleInput.value = '';
    urlInput.value = '';
    idInput.value = '';
    pwInput.value = '';
    tagInput.value = '';
}

function renderTable(filtered = entries) {
    entryTable.innerHTML = '';

    filtered.forEach((entry, index) => {
        const row = document.createElement('tr');

        // Title + Favicon
        const titleCell = document.createElement('td');
        const faviconImg = document.createElement('img');
        faviconImg.src = entry.icon || './a.png';
        faviconImg.width = 30;
        faviconImg.height = 30;
        faviconImg.style.verticalAlign = 'middle';
        faviconImg.style.marginRight = '5px';

        const titleText = document.createTextNode(entry.title);
        titleCell.appendChild(faviconImg);
        titleCell.appendChild(titleText);

        // URL
        const urlCell = document.createElement('td');
        urlCell.textContent = entry.url;

        // ID
        // const idCell = document.createElement('td');
        // idCell.textContent = entry.id;

        // ID (클릭 시 복사)
        const idCell = document.createElement('td');
        idCell.textContent = entry.id;
        idCell.style.cursor = 'default'; // 기본 마우스 포인터 유지
        idCell.title = '클릭하여 복사';

        idCell.addEventListener('click', () => {
            navigator.clipboard.writeText(entry.id).then(() => {
                console.log('ID 클립보드에 복사됨:', entry.id);

                // 복사 완료 메시지 추가
                const copiedMsg = document.createElement('span');
                copiedMsg.textContent = ' ✅';
                copiedMsg.style.color = 'green';
                copiedMsg.style.marginLeft = '5px';
                copiedMsg.className = 'copied-msg';
                idCell.appendChild(copiedMsg);

            }).catch(err => {
                console.error('ID 클립보드 복사 실패:', err);
            });
        });


        // PW (숨김 처리 + 마우스 오버 시 표시 + 클릭 시 클립보드 복사)
        const passwordCell = document.createElement('td');
        const passwordSpan = document.createElement('span');
        passwordSpan.className = 'password';
        passwordSpan.textContent = '*'.repeat(entry.pw.length);

        passwordCell.appendChild(passwordSpan);

        passwordCell.addEventListener('mouseenter', () => {
            passwordSpan.textContent = entry.pw;
        });
        passwordCell.addEventListener('mouseleave', () => {
            passwordSpan.textContent = '*'.repeat(entry.pw.length);
        });

        passwordSpan.addEventListener('click', () => {
            navigator.clipboard.writeText(entry.pw).then(() => {
                console.log('클립보드에 복사됨:', entry.pw);

                // 복사 완료 메시지 추가
                const copiedMsg = document.createElement('span');
                copiedMsg.textContent = ' ✅';
                copiedMsg.style.color = 'green';
                copiedMsg.style.marginLeft = '5px';
                copiedMsg.className = 'copied-msg';
                passwordCell.appendChild(copiedMsg);

                // 2초 후 메시지 제거
                setTimeout(() => {
                    copiedMsg.remove();
                }, 2000);

                // 30초 후 클립보드 만료
                setTimeout(async () => {
                    await navigator.clipboard.writeText(''); // 원하는 문자열 넣어도 재밌음 ㅋㅋ
                    console.log('클립보드에서 비밀번호 삭제됨');
                }, 30000); // 단위 1000 : 1초


            }).catch(err => {
                console.error('클립보드 복사 실패:', err);
            });
        });

        // TAG
        const tagCell = document.createElement('td');
        tagCell.textContent = entry.tag;

        // ACTION (수정 / 삭제 버튼)
        const actionCell = document.createElement('td');

        const editBtn = document.createElement('button');
        editBtn.textContent = '수정';
        editBtn.onclick = () => {
            titleInput.value = entry.title;
            urlInput.value = entry.url;
            idInput.value = entry.id;
            pwInput.value = entry.pw;
            tagInput.value = entry.tag;
            editIndex = index;
            popup.style.display = 'block';
        };

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '삭제';
        deleteBtn.onclick = () => {
            if (confirm('정말 삭제하시겠습니까?')) {
                entries.splice(index, 1);
                renderTable();
                savePasswords(entries);
            }
        };

        actionCell.appendChild(editBtn);
        actionCell.appendChild(deleteBtn);

        // 테이블에 행 추가
        row.appendChild(titleCell);
        row.appendChild(urlCell);
        row.appendChild(idCell);
        row.appendChild(passwordCell);
        row.appendChild(tagCell);
        row.appendChild(actionCell);

        entryTable.appendChild(row);
    });
}



async function getFavicon(url) {
    try {
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }
        const hostname = new URL(url).hostname;
        const faviconUrl = `https://www.google.com/s2/favicons?sz=32&domain=${hostname}`;
        const res = await fetch(faviconUrl);
        if (!res.ok || !res.headers.get("content-type")?.includes("image")) {
            throw new Error("favicon not found");
        }
        return faviconUrl;
    } catch {
        return './a.png'; // 디폴트 아이콘
    }
}

// 검색 기능
searchInput.addEventListener('input', () => {
    const keyword = searchInput.value.toLowerCase();
    const filtered = entries.filter(entry =>
        entry.title.toLowerCase().includes(keyword) ||
        entry.url.toLowerCase().includes(keyword) ||
        entry.id.toLowerCase().includes(keyword) ||
        entry.tag.toLowerCase().includes(keyword)
    );
    renderTable(filtered);
});

// 초기 데이터 불러오기
window.electronAPI.loadPasswords();
window.electronAPI.onPasswordsLoaded(async (loadedEntries) => {
    for (const entry of loadedEntries) {
        if (!entry.icon) {
            entry.icon = await getFavicon(entry.url);
        }
    }
    entries = loadedEntries;
    renderTable();
});

// 페이지가 닫힐 때 자동 저장
window.addEventListener('unload', () => {
    if (entries.length > 0) {
        savePasswords(entries);
    }
});

// 🔐 파일 저장 요청
function savePasswords(passwordEntries) {
    window.electronAPI.savePasswords(passwordEntries);
}

// 🔔 저장 결과 수신
window.electronAPI.onPasswordsSaved((success) => {
    if (success) {
        console.log('비밀번호가 성공적으로 저장되었습니다.');
    } else {
        console.log('비밀번호 저장에 실패했습니다.');
    }
});