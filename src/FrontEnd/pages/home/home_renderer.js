// pages/home/home_renderer.js

// 알림 표시 함수
function showNotification(message) {
    const notif = document.getElementById('notification');
    notif.textContent = message;
    notif.classList.add('show');
    setTimeout(() => notif.classList.remove('show'), 2000);
}

// 페이지 이동 구현
function goTo(page) {
    if (entries.length > 0) {
        savePasswords(entries);
    }
    window.electronAPI.navigate(page);
}

// 입력 필드 및 팝업 요소 참조
const addEntryBtn = document.getElementById('addEntryBtn');
const popup       = document.getElementById('popup');
const saveBtn     = document.getElementById('saveBtn');
const cancelBtn   = document.getElementById('cancelBtn');
const titleInput  = document.getElementById('titleInput');
const urlInput    = document.getElementById('urlInput');
const idInput     = document.getElementById('idInput');
const pwInput     = document.getElementById('pwInput');
const tagInput    = document.getElementById('tagInput');
const entryTable  = document.getElementById('entryTable').querySelector('tbody');
const searchInput = document.getElementById('searchInput');

let entries   = [];
let favorites = {};
let editIndex = null;

// 새 항목 추가 버튼 클릭
addEntryBtn.addEventListener('click', () => {
    editIndex = null;
    popup.style.display = 'block';
});

// 취소 버튼 클릭
cancelBtn.addEventListener('click', () => {
    popup.style.display = 'none';
    clearInputs();
});

// 저장 버튼 클릭
saveBtn.addEventListener('click', async () => {
    const title = titleInput.value;
    const url   = urlInput.value;
    const id    = idInput.value;
    const pw    = pwInput.value;
    const tag   = tagInput.value;
    const icon  = await getFavicon(url);
    const newEntry = { title, url, id, pw, tag, icon };

    if (editIndex !== null) {
        entries[editIndex] = newEntry;
        editIndex = null;
    } else {
        entries.push(newEntry);
    }

    applyFavorites();
    savePasswords(entries);
    saveFavorites();
    renderTable();
    popup.style.display = 'none';
    clearInputs();
});

// 입력 필드 초기화
function clearInputs() {
    titleInput.value = '';
    urlInput.value   = '';
    idInput.value    = '';
    pwInput.value    = '';
    tagInput.value   = '';
}

// 즐겨찾기 키 생성
function generateFavoriteKey(entry) {
    return `${entry.title}::${entry.url}::${entry.tag}`;
}

// 즐겨찾기 정보 적용
function applyFavorites() {
    entries.forEach(entry => {
        const key = generateFavoriteKey(entry);
        entry.favorite = !!favorites[key];
    });
}

// 테이블 렌더링
function renderTable(filtered = entries) {
    entryTable.innerHTML = '';
    const sorted = [...filtered]
        .sort((a, b) => (b.favorite ? 1 : 0) - (a.favorite ? 1 : 0));

    sorted.forEach(entry => {
        const row = document.createElement('tr');

        // Title + Favicon
        const titleCell = document.createElement('td');
        const favicon   = document.createElement('img');
        favicon.src     = entry.icon || './a.png';
        favicon.width   = 48;
        favicon.height  = 48;
        const titleText = document.createElement('span');
        titleText.textContent = entry.title;
        titleText.style.fontSize = '18px';
        titleCell.appendChild(favicon);
        titleCell.appendChild(titleText);

        // URL 셀
        const urlCell = document.createElement('td');
        urlCell.textContent = entry.url;
        urlCell.style.fontSize = '14px';
        urlCell.style.cursor = 'text';

        // ID 복사 (알림)
        const idCell = document.createElement('td');
        const idSpan = document.createElement('span');
        idSpan.textContent = entry.id;
        idSpan.style.cursor = 'pointer';
        idSpan.title = '클릭하여 복사';
        idSpan.addEventListener('click', e => {
            e.stopPropagation();
            navigator.clipboard.writeText(entry.id).then(() => {
                showNotification('복사되었습니다.');
            });
        });
        idCell.appendChild(idSpan);

        // PW 복사/호버 (알림)
        const pwCell = document.createElement('td');
        const pwSpan = document.createElement('span');
        pwSpan.className = 'password';
        pwSpan.textContent = '*'.repeat(entry.pw.length);
        pwSpan.style.cursor = 'pointer';
        pwSpan.addEventListener('mouseenter', () => pwSpan.textContent = entry.pw);
        pwSpan.addEventListener('mouseleave', () => pwSpan.textContent = '*'.repeat(entry.pw.length));
        pwSpan.addEventListener('click', e => {
            e.stopPropagation();
            navigator.clipboard.writeText(entry.pw).then(() => {
                showNotification('복사되었습니다.');
            });
        });
        pwCell.appendChild(pwSpan);

        // Tag
        const tagCell = document.createElement('td');
        tagCell.textContent = entry.tag;

        // Favorite
        const favCell = document.createElement('td');
        const star    = document.createElement('img');
        star.src      = entry.favorite ? './fill.png' : './empty.png';
        star.width    = 20;
        star.height   = 20;
        star.style.cursor = 'pointer';
        star.addEventListener('click', e => {
            e.stopPropagation();
            const key = generateFavoriteKey(entry);
            entry.favorite = !entry.favorite;
            favorites[key] = entry.favorite;
            if (!entry.favorite) delete favorites[key];
            saveFavorites();
            renderTable();
        });
        favCell.appendChild(star);

        // 삭제 버튼
        const actionCell = document.createElement('td');
        const deleteBtn  = document.createElement('button');
        deleteBtn.textContent = '삭제';
        deleteBtn.onclick = e => {
            e.stopPropagation();
            if (confirm('정말 삭제하시겠습니까?')) {
                const key = generateFavoriteKey(entry);
                delete favorites[key];
                entries.splice(entries.indexOf(entry), 1);
                savePasswords(entries);
                saveFavorites();
                renderTable();
            }
        };
        actionCell.appendChild(deleteBtn);

        // 행 클릭 시 수정 모달
        row.addEventListener('click', () => {
            titleInput.value = entry.title;
            urlInput.value   = entry.url;
            idInput.value    = entry.id;
            pwInput.value    = entry.pw;
            tagInput.value   = entry.tag;
            editIndex = entries.indexOf(entry);
            popup.style.display = 'block';
        });

        [titleCell, urlCell, idCell, pwCell, tagCell, favCell, actionCell]
            .forEach(cell => row.appendChild(cell));
        entryTable.appendChild(row);
    });
}

// favicon 가져오기
async function getFavicon(url) {
    try {
        if (!url.startsWith('http')) url = 'https://' + url;
        const hostname   = new URL(url).hostname;
        const faviconUrl = `https://www.google.com/s2/favicons?sz=32&domain=${hostname}`;
        const res        = await fetch(faviconUrl);
        if (!res.ok || !res.headers.get('content-type')?.includes('image')) throw new Error();
        return faviconUrl;
    } catch {
        return './a.png';
    }
}

// 검색 처리
searchInput.addEventListener('input', () => {
    const kw      = searchInput.value.toLowerCase();
    const filtered= entries.filter(e =>
        e.title.toLowerCase().includes(kw) ||
        e.url.toLowerCase().includes(kw)   ||
        e.id.toLowerCase().includes(kw)    ||
        e.tag.toLowerCase().includes(kw)
    );
    renderTable(filtered);
});

// 초기 데이터 로딩
window.electronAPI.onPasswordsLoaded(async loaded => {
    for (const e of loaded) if (!e.icon) e.icon = await getFavicon(e.url);
    entries = loaded;
    favorites = await window.electronAPI.loadFavorites();
    applyFavorites();
    renderTable();
});
window.electronAPI.loadPasswords();

// 저장
function savePasswords(data) { window.electronAPI.savePasswords(data); }
function saveFavorites()        { window.electronAPI.saveFavorites(favorites); }

// 언로드 시 저장
window.addEventListener('unload', () => {
    if (entries.length > 0) savePasswords(entries);
    saveFavorites();
});
