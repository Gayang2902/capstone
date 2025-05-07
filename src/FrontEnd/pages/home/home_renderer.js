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

// 입력 필드 및 팝업
const addEntryBtn = document.getElementById('addEntryBtn');
const popup = document.getElementById('popup');
const saveBtn = document.getElementById('saveBtn');
const cancelBtn = document.getElementById('cancelBtn');
const titleInput = document.getElementById('titleInput');
const urlInput = document.getElementById('urlInput');
const idInput = document.getElementById('idInput');
const pwInput = document.getElementById('pwInput');
const tagInput = document.getElementById('tagInput');
const entryTable = document.getElementById('entryTable').querySelector('tbody');
const searchInput = document.getElementById('searchInput');

let entries = [];
let favorites = {};
let editIndex = null;

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
    const icon = await getFavicon(url);
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

function clearInputs() {
    titleInput.value = '';
    urlInput.value = '';
    idInput.value = '';
    pwInput.value = '';
    tagInput.value = '';
}

// 즐겨찾기 고유 키 생성 (title + url + tag)
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
    const sorted = [...filtered].sort((a, b) => (b.favorite ? 1 : 0) - (a.favorite ? 1 : 0));

    sorted.forEach((entry, index) => {
        const row = document.createElement('tr');

        // Title
        const titleCell = document.createElement('td');
        const favicon = document.createElement('img');
        favicon.src = entry.icon || './a.png';
        favicon.width = 20;
        favicon.height = 20;
        favicon.style.verticalAlign = 'middle';
        favicon.style.marginRight = '5px';
        titleCell.appendChild(favicon);
        titleCell.appendChild(document.createTextNode(entry.title));

        // URL
        const urlCell = document.createElement('td');
        urlCell.textContent = entry.url;

        // ID (복사)
        const idCell = document.createElement('td');
        idCell.textContent = entry.id;
        idCell.style.cursor = 'pointer';
        idCell.title = '클릭하여 복사';
        idCell.addEventListener('click', () => {
            navigator.clipboard.writeText(entry.id).then(() => {
                const copied = document.createElement('span');
                copied.textContent = ' ✅';
                copied.style.color = 'green';
                copied.style.marginLeft = '5px';
                idCell.appendChild(copied);
                setTimeout(() => copied.remove(), 2000);
            });
        });

        // PW
        const pwCell = document.createElement('td');
        const pwSpan = document.createElement('span');
        pwSpan.className = 'password';
        pwSpan.textContent = '*'.repeat(entry.pw.length);
        pwCell.appendChild(pwSpan);
        pwCell.addEventListener('mouseenter', () => {
            pwSpan.textContent = entry.pw;
        });
        pwCell.addEventListener('mouseleave', () => {
            pwSpan.textContent = '*'.repeat(entry.pw.length);
        });
        pwSpan.addEventListener('click', () => {
            navigator.clipboard.writeText(entry.pw).then(() => {
                const copied = document.createElement('span');
                copied.textContent = ' ✅';
                copied.style.color = 'green';
                copied.style.marginLeft = '5px';
                pwCell.appendChild(copied);
                setTimeout(() => copied.remove(), 2000);
                setTimeout(() => navigator.clipboard.writeText(''), 30000);
            });
        });

        // Tag
        const tagCell = document.createElement('td');
        tagCell.textContent = entry.tag;

        // 즐겨찾기
        const favoriteCell = document.createElement('td');
        const star = document.createElement('img');
        star.src = entry.favorite ? './fill_star.png' : './empty_star.png';
        star.width = 20;
        star.height = 20;
        star.style.cursor = 'pointer';
        star.addEventListener('click', () => {
            const key = generateFavoriteKey(entry);
            entry.favorite = !entry.favorite;
            favorites[key] = entry.favorite;
            if (!entry.favorite) delete favorites[key];
            saveFavorites();
            renderTable();
        });
        favoriteCell.appendChild(star);

        // 수정 / 삭제
        const actionCell = document.createElement('td');
        const editBtn = document.createElement('button');
        editBtn.textContent = '수정';
        editBtn.onclick = () => {
            titleInput.value = entry.title;
            urlInput.value = entry.url;
            idInput.value = entry.id;
            pwInput.value = entry.pw;
            tagInput.value = entry.tag;
            editIndex = entries.indexOf(entry);
            popup.style.display = 'block';
        };

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '삭제';
        deleteBtn.onclick = () => {
            if (confirm('정말 삭제하시겠습니까?')) {
                const key = generateFavoriteKey(entry);
                delete favorites[key];
                entries.splice(entries.indexOf(entry), 1);
                savePasswords(entries);
                saveFavorites();
                renderTable();
            }
        };

        actionCell.appendChild(editBtn);
        actionCell.appendChild(deleteBtn);

        row.appendChild(titleCell);
        row.appendChild(urlCell);
        row.appendChild(idCell);
        row.appendChild(pwCell);
        row.appendChild(tagCell);
        row.appendChild(favoriteCell);
        row.appendChild(actionCell);

        entryTable.appendChild(row);
    });
}

// favicon 가져오기
async function getFavicon(url) {
    try {
        if (!url.startsWith('http')) {
            url = 'https://' + url;
        }
        const hostname = new URL(url).hostname;
        const faviconUrl = `https://www.google.com/s2/favicons?sz=32&domain=${hostname}`;
        const res = await fetch(faviconUrl);
        if (!res.ok || !res.headers.get("content-type")?.includes("image")) {
            throw new Error();
        }
        return faviconUrl;
    } catch {
        return './a.png';
    }
}

// 검색
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

// 초기 데이터 로딩
window.electronAPI.loadPasswords();
window.electronAPI.onPasswordsLoaded(async (loadedEntries) => {
    for (const entry of loadedEntries) {
        if (!entry.icon) {
            entry.icon = await getFavicon(entry.url);
        }
    }
    entries = loadedEntries;

    const loadedFavorites = await window.electronAPI.loadFavorites();
    favorites = loadedFavorites;
    applyFavorites();
    renderTable();
});

// 저장
function savePasswords(data) {
    window.electronAPI.savePasswords(data);
}
function saveFavorites() {
    window.electronAPI.saveFavorites(favorites);
}

window.addEventListener('unload', () => {
    savePasswords(entries);
    saveFavorites();
});