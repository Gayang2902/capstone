// 페이지 이동
window.addEventListener('beforeunload', () => {
    if (entries.length > 0) {
        savePasswords(entries);
    }
});

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
        entries[editIndex] = newEntry; // 수정
        editIndex = null;
    } else {
        entries.push(newEntry); // 추가
    }

    renderTable();
    popup.style.display = 'none';
    clearInputs();
    savePasswords(entries); // 저장 요청
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

        const passwordCell = document.createElement('td');
        passwordCell.classList.add('password-cell');
        passwordCell.innerHTML = `<span class="password">${'*'.repeat(entry.pw.length)}</span>`;

        const editBtn = document.createElement('button');
        editBtn.innerText = '수정';
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
        deleteBtn.innerText = '삭제';
        deleteBtn.onclick = () => {
            if (confirm('정말 삭제하시겠습니까?')) {
                entries.splice(index, 1);
                renderTable();
                savePasswords(entries); // 삭제 후 저장
            }
        };

        row.innerHTML = `
            <td><img src="${entry.icon}" width="16" height="16" /></td>
            <td>${entry.title}</td>
            <td>${entry.url}</td>
            <td>${entry.id}</td>
        `;
        row.appendChild(passwordCell);
        row.innerHTML += `<td>${entry.tag}</td>`;

        const actionCell = document.createElement('td');
        actionCell.appendChild(editBtn);
        actionCell.appendChild(deleteBtn);
        row.appendChild(actionCell);

        entryTable.appendChild(row);

        const passwordSpan = passwordCell.querySelector('.password');
        passwordCell.addEventListener('mouseover', () => {
            passwordSpan.innerHTML = entry.pw;
        });
        passwordCell.addEventListener('mouseout', () => {
            passwordSpan.innerHTML = '*'.repeat(entry.pw.length);
        });
    });
}

async function getFavicon(url) {
    try {
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }
        const hostname = new URL(url).hostname;
        return `https://www.google.com/s2/favicons?sz=32&domain=${hostname}`;
    } catch (err) {
        return '';
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
window.electronAPI.onPasswordsLoaded((loadedEntries) => {
    entries = loadedEntries;
    renderTable();
});

// 페이지가 닫힐 때 자동 저장 (추가 보완)
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