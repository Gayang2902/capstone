console.log('✅ home_renderer.js 실제 로드됨');
// File: pages/home/home_renderer.js

// ─── Toast Notification Utility ───
if (!document.getElementById('toast-container')) {
  const toastContainer = document.createElement('div');
  toastContainer.id = 'toast-container';
  toastContainer.style.cssText = 'position: fixed; top: 1rem; right: 1rem; z-index: 10000; display: flex; flex-direction: column; gap: 0.5rem;';
  document.body.appendChild(toastContainer);
}
function showToast(message, type = 'success', duration = 3000) {
  const toast = document.createElement('div');
  toast.textContent = message;
  toast.className = `px-4 py-2 rounded shadow text-white ${type === 'error' ? 'bg-red-500' : 'bg-teal-500'}`;
  document.getElementById('toast-container').appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, duration);
}

const editModal      = document.getElementById('editModal');
const editForm       = document.getElementById('editForm');
const saveEdit       = document.getElementById('saveEdit');
const cancelEdit     = document.getElementById('cancelEdit');

const navHome    = document.getElementById('navHome');
const navStats   = document.getElementById('navStats');
const navGroup   = document.getElementById('navGroup');
const navSetting = document.getElementById('navSetting');
const btnScreenshotPrevent = document.getElementById('btnScreenshotPrevent');
const searchInput = document.getElementById('input-search');

const addModal      = document.getElementById('addPasswordModal');
const modalBox      = document.getElementById('modalBox');
const cancelBtn     = document.getElementById('cancelBtn');
const backBtn       = document.getElementById('backBtn');
const typeSelection = document.getElementById('type-selection');
const formContainer = document.getElementById('dynamicForm');
const saveBtn       = document.getElementById('saveBtn');

let favorite = false;
let selectedType = null;
let currentEntries = [];

// 타입별 Font Awesome 아이콘 클래스 매핑
const typeIconClasses = {
  wifi:     'fa-solid fa-wifi text-indigo-500',
  website:  'fa-solid fa-globe text-blue-600',
  server:   'fa-solid fa-server text-blue-500',
  bankbook: 'fa-solid fa-book text-yellow-500',
  identity: 'fa-solid fa-id-card text-pink-500',
  security: 'fa-solid fa-shield-alt text-green-500',
  card:     'fa-solid fa-credit-card text-teal-500'
};

// ─────────────────────────────────────────────────────────────
// 공통 필드 설정: 유형별 필드 목록 (전역)
const fieldConfig = {
  wifi: [
    { key: 'name',     label: '이름' },
    { key: 'pwd',      label: '비밀번호' },
    { key: 'comments', label: '설명'}
  ],
  server: [
    { key: 'id',       label: '아이디' },
    { key: 'pwd',      label: '비밀번호' },
    { key: 'host',     label: '호스트' },
    { key: 'port',     label: '포트' },
    { key: 'comments', label: '설명'}
  ],
  bankbook: [
    { key: 'bank_name', label: '은행 이름' },
    { key: 'num',       label: '계좌번호' },
    { key: 'master',    label: '예금주' },
    { key: 'pwd',       label: '계좌 비밀번호' },
    { key: 'comments', label: '설명'}
  ],
  identity: [
    { key: 'name',       label: '이름' },
    { key: 'eng_name',   label: '영문이름' },
    { key: 'address',    label: '주소' },
    { key: 'birth_date', label: '생일' },
    { key: 'citizen',    label: '주민번호' },
    { key: 'comments', label: '설명'}
  ],
  security: [
    { key: 'content',    label: '내용' },
    { key: 'comments', label: '설명'}
  ],
  website: [
    { key: 'url',        label: 'URL' },
    { key: 'id',         label: '아이디' },
    { key: 'pwd',        label: '비밀번호' },
    { key: 'email',      label: '이메일' },
    { key: 'comments', label: '설명'}
  ],
  card: [
    { key: 'bank_name',   label: '은행이름' },
    { key: 'name',        label: '예금주' },
    { key: 'card_number', label: '카드 번호' },
    { key: 'cvc',         label: 'CVC' },
    { key: 'last_day',    label: '만료일' },
    { key: 'comments', label: '설명'}
  ]
};

// ─────────────────────────────────────────────────────────────
// 공통: 엔트리 카드 생성 헬퍼 (홈 전용)
// ─────────────────────────────────────────────────────────────
window.createEntryCard = function(entry) {
  console.log('▶ entry:', entry);
  const card = document.createElement('div');
  card.className = `
    flex flex-col space-y-3 p-4 bg-white rounded-xl border border-gray-200 shadow-md w-full mb-4
    min-h-[240px]
  `;
  console.log('🛠️ [DEBUG] 카드 클래스:', card.className.trim().split(/\s+/));
  card.dataset.uid = entry.UID;

  // 1) Header: Icon + Label + favorite icon
  const header = document.createElement('div');
  header.className = 'flex justify-between items-center mb-2 border-b border-gray-200 pb-2';
  // Left side: icon + title
  const leftDiv = document.createElement('div');
  leftDiv.className = 'flex items-center';
  let iconEl;
  if (entry.type === 'website') {
    let domain;
    try { domain = new URL(entry.url).hostname; }
    catch { domain = entry.url.replace(/^https?:\/\//, '').split('/')[0]; }
    iconEl = document.createElement('img');
    iconEl.src = `https://logo.clearbit.com/${domain}?size=32`;
    iconEl.alt = 'favicon';
    iconEl.className = 'w-8 h-8 object-contain mr-3';
  } else {
    iconEl = document.createElement('i');
    iconEl.className = `${typeIconClasses[entry.type] || 'fa-solid fa-key text-gray-600'} text-2xl mr-3`;
  }
  leftDiv.appendChild(iconEl);
  const title = document.createElement('span');
  title.className = 'text-lg font-semibold';
  title.textContent = entry.label || entry.type;
  leftDiv.appendChild(title);
  // 최근 수정일 표시
  const modSpan = document.createElement('span');
  modSpan.className = 'text-sm text-gray-500 ml-4';
  modSpan.textContent = `최근 수정일: ${entry.modified_at}`;
  leftDiv.appendChild(modSpan);
  header.appendChild(leftDiv);
  // Right side icons: favorite, edit, and delete
  const favIcon = document.createElement('i');
  favIcon.className = (entry.favorite === 'true' || entry.favorite === true)
    ? 'fa-solid fa-star text-yellow-500 text-xl cursor-pointer'
    : 'fa-regular fa-star text-gray-400 text-xl cursor-pointer';
  favIcon.addEventListener('click', async e => {
    e.stopPropagation();
    // FLIP animation: record initial position
    const cardEl = document.querySelector(`[data-uid="${entry.UID}"]`);
    const firstRect = cardEl.getBoundingClientRect();
    // Toggle favorite state
    entry.favorite = !(entry.favorite === true || entry.favorite === 'true');
    // Update icon classes
    favIcon.classList.toggle('fa-solid', entry.favorite);
    favIcon.classList.toggle('fa-regular', !entry.favorite);
    favIcon.classList.toggle('text-yellow-500', entry.favorite);
    favIcon.classList.toggle('text-gray-400', !entry.favorite);
    // Persist change via IPC
    try {
      await window.electronAPI.updatePasswordEntry({
        UID: entry.UID,
        favorite: entry.favorite.toString()
      });
    } catch (err) {
      console.error('즐겨찾기 저장 실패:', err);
    }
    // Move card in DOM
    const container = document.getElementById('card-container');
    if (entry.favorite) {
      container.prepend(cardEl);
    } else {
      container.appendChild(cardEl);
    }
    // FLIP: record final position and animate
    const lastRect = cardEl.getBoundingClientRect();
    const deltaY = firstRect.top - lastRect.top;
    cardEl.style.transform = `translateY(${deltaY}px)`;
    cardEl.style.transition = 'transform 300ms ease';
    requestAnimationFrame(() => {
      cardEl.style.transform = '';
    });
    // (Removed: loadAndRenderList call)
  });

  // Edit icon
  const editIcon = document.createElement('i');
  editIcon.className = 'fa-solid fa-pen text-blue-500 text-xl cursor-pointer';
  editIcon.addEventListener('click', e => {
    e.stopPropagation();
    openEditModal(entry.UID);
  });

  const delIcon = document.createElement('i');
  delIcon.className = 'fa-solid fa-trash text-red-500 text-xl cursor-pointer ml-3';
  delIcon.addEventListener('click', async e => {
    e.stopPropagation();
    if (!confirm('정말 삭제하시겠습니까?')) return;
    try {
      const res = await window.electronAPI.deletePasswordEntry(entry.UID);
      if (res.status) {
        removeCard(entry.UID);
        showToast('삭제되었습니다.');
      } else {
        showToast('삭제 실패: ' + res.error_message, 'error');
      }
    } catch {
      showToast('삭제 오류', 'error');
    }
  });
  const rightDiv = document.createElement('div');
  rightDiv.className = 'flex items-center space-x-2';
  rightDiv.appendChild(favIcon);
  rightDiv.appendChild(editIcon);
  rightDiv.appendChild(delIcon);
  header.appendChild(rightDiv);
  card.appendChild(header);

  // 2) Field list by type using common fieldConfig
  const config = fieldConfig[entry.type] || [];
  config.forEach(({ key, label }) => {
    const value = entry[key];
    // 항상 pwd 필드 렌더, 나머지는 값이 없으면 스킵
    if (key !== 'pwd' && (value == null || value === '')) return;
    const row = document.createElement('div');
    row.className = 'flex flex-wrap mb-2 bg-gray-50 p-2 rounded-lg';
    const keyEl = document.createElement('span');
    keyEl.className = 'font-medium text-indigo-600 mr-2';
    keyEl.textContent = `${label}:`;
    const valEl = document.createElement('span');
    valEl.classList.add('break-words','text-gray-800');
    if (key === 'pwd') {
      // 초기 플레이스홀더
      valEl.textContent = '••••••';
      let revealed = null;
      // 실제 비밀번호 길이 기반 마스킹을 위해 fetch
      window.electronAPI.getPasswordDetail({ UID: entry.UID })
        .then(res => {
          if (res.status && res.data.pwd) {
            revealed = res.data.pwd;
            valEl.textContent = '*'.repeat(revealed.length);
          }
        })
        .catch(() => {
          // fetch 실패 시 placeholder 유지
        });
      valEl.addEventListener('mouseenter', async () => {
        const res = await window.electronAPI.getPasswordDetail({ UID: entry.UID });
        if (res.status && res.data.pwd) {
          revealed = res.data.pwd;
          valEl.textContent = revealed;
        }
      });
      valEl.addEventListener('mouseleave', () => {
        valEl.textContent = revealed ? '*'.repeat(revealed.length) : '••••••';
        // revealed = null;  // 유지
      });
      valEl.addEventListener('click', async e => {
        e.stopPropagation();
        const toCopy = revealed || (await window.electronAPI.getPasswordDetail({ UID: entry.UID })).data.pwd;
        await navigator.clipboard.writeText(toCopy);
        showToast('비밀번호 복사됨');
      });
    } else {
      valEl.textContent = value;
      valEl.classList.add('cursor-pointer');
      valEl.addEventListener('click', e => {
        e.stopPropagation();
        navigator.clipboard.writeText(value);
        showToast('복사되었습니다.');
      });
    }
    row.append(keyEl, valEl);
    card.appendChild(row);
  });

  // // 3) Comments at bottom
  // if (entry.comments) {
  //   const com = document.createElement('div');
  //   com.className = 'mt-4 text-sm text-gray-600 whitespace-pre-wrap bg-gray-50 p-2 rounded-lg';
  //   com.textContent = entry.comments;
  //   card.appendChild(com);
  // }


  // 4) Click to open edit modal
  // (Removed: card click no longer opens edit modal)
  return card;
};
// Partial DOM update helpers
const container = document.getElementById('card-container');
function replaceCard(entry) {
  const old = container.querySelector(`[data-uid="${entry.UID}"]`);
  if (!old) return;
  const newCard = window.createEntryCard(entry);
  newCard.dataset.uid = entry.UID;
  old.replaceWith(newCard);
}
function removeCard(uid) {
  const old = container.querySelector(`[data-uid="${uid}"]`);
  if (old) old.remove();
}
function addCard(entry) {
  const card = window.createEntryCard(entry);
  card.dataset.uid = entry.UID;
  container.prepend(card);
}

// ─────────────────────────────────────────────────────────────
// ======== 1) 페이지 초기화 ========
// File: pages/home/home_renderer.js

window.addEventListener('DOMContentLoaded', () => {
  // Disable drag everywhere except for specific text
  document.body.setAttribute('draggable', 'false');
  document.addEventListener('dragstart', e => {
    if (!e.target.classList.contains('draggable-text')) {
      e.preventDefault();
    }
  });

  console.log('[home_renderer] DOMContentLoaded');  // ← 확인용

  // (1) 네비 하이라이트
  setActiveButton(navHome);

  // (2) 스크린샷 방지
  let screenshotBlocked = true;
  window.electronAPI.preventScreenshot();
  btnScreenshotPrevent?.addEventListener('click', () => {
    screenshotBlocked = !screenshotBlocked;
    if (screenshotBlocked) {
      window.electronAPI.preventScreenshot();
      btnScreenshotPrevent.title = '스크린샷 방지';
      btnScreenshotPrevent.innerHTML = `<i class="fa-solid fa-shield-halved text-indigo-700 text-lg"></i>`;
    } else {
      window.electronAPI.allowScreenshot();
      btnScreenshotPrevent.title = '스크린샷 허용';
      btnScreenshotPrevent.innerHTML = `<i class="fa-solid fa-shield text-gray-600 text-lg"></i>`;
    }
  });

  // (3) 초기 리스트 로드 (검색어 없이 전체)
  loadAndRenderList('');

  // (4) “+” 버튼 모달 열기
  const addBtnInHome = document.getElementById('filterAddBtnInner');
  if (addBtnInHome) {
    addBtnInHome.addEventListener('click', openModal);
  }

  // (5) 검색 입력 시 — 이미 렌더된 카드만 show/hide
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.trim().toLowerCase();
      document
          .querySelectorAll('#card-container > div')
          .forEach(card => {
            // 카드 안의 텍스트를 통째로 읽어서 검색어 포함 여부 판단
            const text = card.innerText.toLowerCase();
            card.style.display = q === '' || text.includes(q) ? '' : 'none';
          });
    });
  }
});





// ─────────────────────────────────────────────────────────────
// ======== 2) 네비 버튼 하이라이트 ========
function setActiveButton(btn) {
  document.querySelectorAll('.nav-btn').forEach(b => {
    b.classList.remove('bg-indigo-100', 'text-indigo-800', 'shadow-lg');
  });
  btn.classList.add('bg-indigo-100', 'text-indigo-800', 'shadow-lg');
}

// 네비게이션 클릭 시
navHome.addEventListener('click', () => { goTo('home'); loadAndRenderList(); updateAllCountButton(); });
navStats.addEventListener('click', () => goTo('statistic'));
navGroup.addEventListener('click', () => goTo('group'));
navSetting.addEventListener('click', () => goTo('setting'));

// ─────────────────────────────────────────────────────────────
// ======== 3) “비밀번호 추가” 모달 열기/닫기 & 동적 폼 로직 ========
function openModal() {
  favorite = false;  // 기본값 false
  addModal.classList.remove('opacity-0', 'pointer-events-none');
  addModal.classList.add('opacity-100');
  modalBox.classList.remove('scale-95');
  modalBox.classList.add('scale-100');
  typeSelection.classList.remove('hidden');
  formContainer.innerHTML = '';
  backBtn.classList.add('hidden');
  selectedType = null;
}

function closeModal() {
  modalBox.classList.remove('scale-100');
  modalBox.classList.add('scale-95');
  addModal.classList.remove('opacity-100');
  addModal.classList.add('opacity-0');
  setTimeout(() => {
    addModal.classList.add('pointer-events-none');
  }, 200);
}

cancelBtn.addEventListener('click', closeModal);
addModal.addEventListener('click', (e) => {
  // 클릭한 요소가 모달 백그라운드 컨테이너일 때만 닫기 (e.currentTarget 사용)
  if (e.target === e.currentTarget) {
    closeModal();
  }
});

// 유형별 버튼 참조
const typeButtons = {
  wifi:     document.getElementById('type-wifi'),
  server:   document.getElementById('type-server'),
  bankbook: document.getElementById('type-bankbook'),
  identity: document.getElementById('type-identity'),
  security: document.getElementById('type-security'),
  website:  document.getElementById('type-website'),
  card:     document.getElementById('type-card'),
};

// 공통 입력란(레이블 + 즐겨찾기 아이콘 + comments)을 포함하도록 템플릿 감싸기
const wrapWithCommonFields = (innerHtml) => {
  return `
    <div class="flex justify-between items-center mb-4">
      <input
        type="text"
        id="entry-label"
        required
        class="flex-1 mr-2 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:outline-none"
        placeholder="레이블 입력"
      />
      <button id="favorite-toggle" class="w-10 h-10 flex items-center justify-center text-gray-400 focus:outline-none">
        <i class="fa-regular fa-star text-2xl"></i>
      </button>
    </div>
    ${innerHtml}
    <div class="mt-4">
      <label class="block text-sm font-medium text-gray-700">Comments</label>
      <textarea
        id="entry-comments"
        rows="3"
        class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:outline-none"
        placeholder="추가 설명을 입력하세요 (선택)"
      ></textarea>
    </div>
  `;
};

// 유형별 입력 필드 템플릿 (기존에서 변경 없이 유지)
const formTemplates = {
  wifi: `
    <div>
      <label class="block text-sm font-medium text-gray-700">Name</label>
      <input type="text" id="wifi-name" required
             class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:outline-none"
             placeholder="Wi-Fi 이름" />
    </div>
    <div class="mt-3">
      <label class="block text-sm font-medium text-gray-700">Password</label>
      <input type="password" id="wifi-pwd" required
             class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:outline-none"
             placeholder="Wi-Fi 비밀번호" />
    </div>
  `,
  server: `
    <div>
      <label class="block text-sm font-medium text-gray-700">ID</label>
      <input type="text" id="server-id" required
             class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:outline-none"
             placeholder="서버 계정 ID" />
    </div>
    <div class="mt-3">
      <label class="block text-sm font-medium text-gray-700">Password</label>
      <input type="password" id="server-pwd" required
             class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:outline-none"
             placeholder="서버 비밀번호" />
    </div>
    <div class="mt-3">
      <label class="block text-sm font-medium text-gray-700">Host</label>
      <input type="text" id="server-host" required
             class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:outline-none"
             placeholder="서버 호스트" />
    </div>
    <div class="mt-3">
      <label class="block text-sm font-medium text-gray-700">Port</label>
      <input type="number" id="server-port" required
             class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:outline-none"
             placeholder="포트 번호" />
    </div>
  `,
  bankbook: `
    <div>
      <label class="block text-sm font-medium text-gray-700">Account Number</label>
      <input type="text" id="bankbook-account-num" required
             class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:outline-none"
             placeholder="계좌 번호" />
    </div>
    <div class="mt-3">
      <label class="block text-sm font-medium text-gray-700">Account Password</label>
      <input type="password" id="bankbook-account-pwd" required
             class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:outline-none"
             placeholder="계좌 비밀번호" />
    </div>
    <div class="mt-3">
      <label class="block text-sm font-medium text-gray-700">Bank Name</label>
      <input type="text" id="bankbook-bank-name" required
             class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:outline-none"
             placeholder="은행 이름" />
    </div>
    <div class="mt-3">
      <label class="block text-sm font-medium text-gray-700">Master</label>
      <input type="text" id="bankbook-master" required
             class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:outline-none"
             placeholder="예금주" />
    </div>
  `,
  identity: `
    <div>
      <label class="block text-sm font-medium text-gray-700">Citizen ID</label>
      <input type="text" id="identity-citizen" required
             class="mt-1 block w-full border border-gray-300 rounded-md:px-3 py-2 focus:ring-indigo-500 focus:outline-none"
             placeholder="주민등록번호" />
    </div>
    <div class="mt-3">
      <label class="block text-sm font-medium text-gray-700">Name</label>
      <input type="text" id="identity-name" required
             class="mt-1 block w-full border border-gray-300 rounded-md:px-3 py-2 focus:ring-indigo-500 focus:outline-none"
             placeholder="이름" />
    </div>
    <div class="mt-3">
      <label class="block text-sm font-medium text-gray-700">English Name</label>
      <input type="text" id="identity-eng-name" required
             class="mt-1 block w-full border border-gray-300 rounded-md:px-3 py-2 focus:ring-indigo-500 focus:outline-none"
             placeholder="영문 이름" />
    </div>
    <div class="mt-3">
      <label class="block text-sm font-medium text-gray-700">Address</label>
      <input type="text" id="identity-address" required
             class="mt-1 block w-full border border-gray-300 rounded-md:px-3 py-2 focus:ring-indigo-500 focus:outline-none"
             placeholder="주소" />
    </div>
    <div class="mt-3">
      <label class="block text-sm font-medium text-gray-700">Birth Date</label>
      <input type="date" id="identity-birth-date" required
             class="mt-1 block w-full border border-gray-300 rounded-md:px-3 py-2 focus:ring-indigo-500 focus:outline-none"
      />
    </div>
  `,
  security: `
    <div>
      <label class="block text-sm font-medium text-gray-700">Content</label>
      <textarea id="security-content" rows="4" required
                class="mt-1 block w-full border border-gray-300 rounded-md:px-3 py-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="보안 관련 내용"></textarea>
    </div>
  `,
  website: `
    <div>
      <label class="block text-sm font-medium text-gray-700">URL</label>
      <input type="url" id="website-url" required
             class="mt-1 block w-full border border-gray-300 rounded-md:px-3 py-2 focus:ring-indigo-500 focus:outline-none"
             placeholder="https://example.com" />
    </div>
    <div class="mt-3">
      <label class="block text-sm font-medium text-gray-700">ID</label>
      <input type="text" id="website-id" required
             class="mt-1 block w-full border border-gray-300 rounded-md:px-3 py-2 focus:ring-indigo-500 focus:outline-none"
             placeholder="웹사이트 ID" />
    </div>
    <div class="mt-3">
      <label class="block text-sm font-medium text-gray-700">Password</label>
      <input type="password" id="website-pwd" required
             class="mt-1 block w-full border border-gray-300 rounded-md:px-3 py-2 focus:ring-indigo-500 focus:outline-none"
             placeholder="웹사이트 비밀번호" />
    </div>
    <div class="mt-3">
      <label class="block text-sm font-medium text-gray-700">Email</label>
      <input type="email" id="website-email" required
             class="mt-1 block w-full border border-gray-300 rounded-md:px-3 py-2 focus:ring-indigo-500 focus:outline-none"
             placeholder="이메일 주소" />
    </div>
  `,
  card: `
    <div>
      <label class="block text-sm font-medium text-gray-700">Card Number</label>
      <input type="text" id="card-number" required
             class="mt-1 block w-full border border-gray-300 rounded-md:px-3 py-2 focus:ring-indigo-500 focus:outline-none"
             placeholder="카드 번호" />
    </div>
    <div class="mt-3">
      <label class="block text-sm font-medium text-gray-700">CVC</label>
      <input type="text" id="card-cvc" required
             class="mt-1 block w-full border border-gray-300 rounded-md:px-3 py-2 focus:ring-indigo-500 focus:outline-none"
             placeholder="CVC 코드" />
    </div>
    <div class="mt-3">
      <label class="block text-sm font-medium text-gray-700">Expiry Date</label>
      <input type="month" id="card-expiry" required
             class="mt-1 block w-full border border-gray-300 rounded-md:px-3 py-2 focus:ring-indigo-500 focus:outline-none"
      />
    </div>
    <div class="mt-3">
      <label class="block text-sm font-medium text-gray-700">Bank Name</label>
      <input type="text" id="card-bank-name" required
             class="mt-1 block w-full border border-gray-300 rounded-md:px-3 py-2 focus:ring-indigo-500 focus:outline-none"
             placeholder="발급 은행" />
    </div>
    <div class="mt-3">
      <label class="block text-sm font-medium text-gray-700">Card Password</label>
      <input type="password" id="card-pwd" required
             class="mt-1 block w-full border border-gray-300 rounded-md:px-3 py-2 focus:ring-indigo-500 focus:outline-none"
             placeholder="카드 비밀번호" />
    </div>
    <div class="mt-3">
      <label class="block text-sm font-medium text-gray-700">Name on Card</label>
      <input type="text" id="card-name" required
             class="mt-1 block w-full border border-gray-300 rounded-md:px-3 py-2 focus:ring-indigo-500 focus:outline-none"
             placeholder="카드 소유자 이름" />
    </div>
  `
};

// 각 유형 버튼 클릭 시 동적으로 폼을 삽입
Object.entries(typeButtons).forEach(([key, btn]) => {
  btn?.addEventListener('click', () => {
    selectedType = key;
    typeSelection.classList.add('hidden');
    backBtn.classList.remove('hidden');

    // 공통 입력란을 포함한 HTML을 생성
    const wrapped = wrapWithCommonFields(formTemplates[key] || '');
    formContainer.innerHTML = wrapped;

    // “favorite” 별표 토글 이벤트
    const favBtn = document.getElementById('favorite-toggle');
    const favIcon = favBtn.querySelector('i');
    favIcon.className = 'fa-regular fa-star text-2xl text-gray-400';
    favBtn.addEventListener('click', () => {
      favorite = !favorite;
      if (favorite) {
        favIcon.className = 'fa-solid fa-star text-2xl text-yellow-500';
      } else {
        favIcon.className = 'fa-regular fa-star text-2xl text-gray-400';
      }
    });
  });
});

// 뒤로가기 버튼 클릭 시 유형 선택 화면으로 돌아감
backBtn.addEventListener('click', () => {
  selectedType = null;
  formContainer.innerHTML = '';
  typeSelection.classList.remove('hidden');
  backBtn.classList.add('hidden');
});

// ─────────────────────────────────────────────────────────────
// ======== 4) “저장” 버튼 클릭 시 ========
saveBtn.addEventListener('click', async () => {
  if (!selectedType) {
    alert('우선 유형을 선택해주세요.');
    return;
  }

  // 공통 필드: label, comments, favorite
  const labelValue = document.getElementById('entry-label').value.trim();
  const commentsValue = document.getElementById('entry-comments').value.trim();
  if (!labelValue) {
    alert('레이블을 입력하세요.');
    return;
  }

  const data = {
    type: selectedType,
    label: labelValue,
    comments: commentsValue,
    favorite: favorite.toString()
  };

  switch (selectedType) {
    case 'wifi':
      data.name = document.getElementById('wifi-name').value.trim();
      data.pwd  = document.getElementById('wifi-pwd').value.trim();
      if (!data.name || !data.pwd) {
        alert('모든 필드를 입력해주세요.');
        return;
      }
      break;
    case 'server':
      data.id   = document.getElementById('server-id').value.trim();
      data.pwd  = document.getElementById('server-pwd').value.trim();
      data.host = document.getElementById('server-host').value.trim();
      data.port = document.getElementById('server-port').value.trim();
      if (!data.id || !data.pwd || !data.host || !data.port) {
        alert('모든 필드를 입력해주세요.');
        return;
      }
      break;
    case 'bankbook':
      data.num = document.getElementById('bankbook-account-num').value.trim();
      data.pwd = document.getElementById('bankbook-account-pwd').value.trim();
      data.bank_name   = document.getElementById('bankbook-bank-name').value.trim();
      data.master     = document.getElementById('bankbook-master').value.trim();
      if (!data.num || !data.pwd || !data.bank_name || !data.master) {
        alert('모든 필드를 입력해주세요.');
        return;
      }
      break;
    case 'identity':
      data.citizen   = document.getElementById('identity-citizen').value.trim();
      data.name      = document.getElementById('identity-name').value.trim();
      data.eng_name   = document.getElementById('identity-eng-name').value.trim();
      data.address   = document.getElementById('identity-address').value.trim();
      data.birth_date = document.getElementById('identity-birth-date').value;
      if (!data.citizen || !data.name || !data.eng_name || !data.address || !data.birth_date) {
        alert('모든 필드를 입력해주세요.');
        return;
      }
      break;
    case 'security':
      data.content = document.getElementById('security-content').value.trim();
      if (!data.content) {
        alert('Content를 입력하세요.');
        return;
      }
      break;
    case 'website':
      data.url   = document.getElementById('website-url').value.trim();
      data.id    = document.getElementById('website-id').value.trim();
      data.pwd   = document.getElementById('website-pwd').value.trim();
      data.email = document.getElementById('website-email').value.trim();
      if (!data.url || !data.id || !data.pwd || !data.email) {
        alert('모든 필드를 입력해주세요.');
        return;
      }
      break;
    case 'card':
      data.card_number = document.getElementById('card-number').value.trim();
      data.cvc        = document.getElementById('card-cvc').value.trim();
      data.last_day     = document.getElementById('card-expiry').value;
      data.bank_name   = document.getElementById('card-bank-name').value.trim();
      data.pwd    = document.getElementById('card-pwd').value.trim();
      data.name   = document.getElementById('card-name').value.trim();
      if (!data.card_number || !data.cvc || !data.last_day || !data.bank_name || !data.pwd || !data.name) {
        alert('모든 필드를 입력해주세요.');
        return;
      }
      break;
    default:
      break;
  }

  // try {
  //   const res = await window.electronAPI.createPasswordEntry(data);
  //   console.log('➕ 생성 핸들러 실행, entry=', res.data);
  //   if (!res.status) {
  //     alert('저장에 실패했습니다: ' + res.error_message);
  //     return;
  //   }
  //   closeModal();
  //   // Add newly created entry without reloading all
  //   addCard(res.data.data);
  //   // Update currentEntries array to include new entry at the beginning
  //   currentEntries.unshift(res.data.data);
  // } catch (err) {
  //   alert('저장 중 오류가 발생했습니다:\n' + (err.message || err));
  // }

  try {
    const res = await window.electronAPI.createPasswordEntry(data);
    console.log('➕ 생성 핸들러 실행, entry=', res.data);

    if (!res.status) {
      alert('저장에 실패했습니다: ' + res.error_message);
      return;
    }
    closeModal();
    // Reload full list to ensure all handlers on new cards
    const scrollParent = findScrollParent(container);
    const prevScroll = scrollParent.scrollTop;
    await loadAndRenderList(searchInput?.value || '');
    scrollParent.scrollTop = prevScroll;

  } catch (err) {
    alert('저장 중 오류가 발생했습니다:\n' + (err.message || err));
  }

});

// ─────────────────────────────────────────────────────────────
// ===== 5) 전체 비밀번호 가져와서 렌더링 =====
// ─────────────────────────────────────────────────────────────
/**
 * Find nearest ancestor with a scrollable vertical overflow.
 * @param {HTMLElement} el
 * @returns {HTMLElement}
 */
function findScrollParent(el) {
  let parent = el.parentElement;
  while (parent) {
    const style = getComputedStyle(parent);
    if (/(auto|scroll)/.test(style.overflowY)) return parent;
    parent = parent.parentElement;
  }
  return el;
}

async function loadAndRenderList(query = '') {
  // 함수 진입 시 로그
  console.log('[home_renderer] ▶ loadAndRenderList 호출, query =', query);
  console.log('[home_renderer]    현재 dataset.page =', document.body.dataset.page);

  // Update "전체" button with total password count on each load
  window.electronAPI.getPasswordCount()
    .then(res => {
      if (res.status && res.data && typeof res.data.total === 'number') {
        const btn = document.getElementById('btnAllCount');
        if (btn) btn.textContent = `전체 ${res.data.total}개`;
      }
    })
    .catch(err => console.error('getPasswordCount 오류:', err));


  // ─── 홈 화면이 아닐 땐 바로 돌아가기 (디버깅 후에도 남겨두세요)
  if (document.body.dataset.page !== 'home') {
    console.log('[home_renderer]    home 아님, 리턴');
    return;
  }

  // ─── 컨테이너 요소가 반드시 있어야만 진행 ───────────────────
  const container = document.getElementById('card-container');
  // Preserve scroll position of nearest scrollable ancestor
  const scrollContainer = findScrollParent(container);
  const prevScroll = scrollContainer.scrollTop;
  // 새 렌더링 로직
  if (!container) return;
  container.innerHTML = `<div class="col-span-1 text-center text-gray-500 italic py-8">로딩 중...</div>`;

  let res;
  try {
    res = await window.electronAPI.getAllPasswords();
  } catch (err) {
    container.innerHTML = `<div class="col-span-1 text-center text-red-500">불러오기 예외: ${err.message}</div>`;
    return;
  }
  if (!res.status) {
    container.innerHTML = `<div class="col-span-1 text-center text-red-500">불러오기 실패: ${res.error_message}</div>`;
    return;
  }

  let entries = Array.isArray(res.data?.data) ? res.data.data : [];
  currentEntries = entries;
  if (query) {
    const lower = query.toLowerCase();
    entries = entries.filter(e =>
      Object.values(e).some(v => String(v).toLowerCase().includes(lower))
    );
  }
  // 2) Sort favorites and non-favorites by created_at ascending
  const favEntries = entries
    .filter(e => e.favorite === true || e.favorite === 'true')
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  const nonFavEntries = entries
    .filter(e => !(e.favorite === true || e.favorite === 'true'))
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  entries = favEntries.concat(nonFavEntries);
  if (!entries.length) {
    container.innerHTML = `<div class="col-span-1 text-center text-gray-500 italic py-8">저장된 비밀번호가 없습니다.</div>`;
    return;
  }

  container.innerHTML = '';

  entries.forEach(entry => {
    const card = window.createEntryCard(entry);
    container.appendChild(card);
  });
  // Restore scroll position
  scrollContainer.scrollTop = prevScroll;
}

// Helper: update the "전체" button count
function updateAllCountButton() {
  const btn = document.getElementById('btnAllCount');
  if (!btn) return;
  window.electronAPI.getPasswordCount()
      .then(res => {
        if (res.status && res.data && typeof res.data.total === 'number') {
          btn.textContent = `전체 ${res.data.total}`;
        }
      })
      .catch(err => console.error('getPasswordCount 오류:', err));
}


// ==================================== 비밀번호 업데이트 ==============================================
// 취소 버튼
cancelEdit.addEventListener('click', () => {
  editModal.classList.add('hidden');
});

// Modal background click handlers (generalized for all modals)
// Background click closes Add Password Modal
addModal.addEventListener('click', e => {
  if (e.target.id === 'addPasswordModal') closeModal();
});

// Background click closes Edit Modal
editModal.addEventListener('click', e => {
  if (e.target.id === 'editModal') {
    editModal.classList.add('hidden');
    editModal.classList.remove('flex');
  }
});

// Background click closes Generator Modal
const genModal = document.getElementById('generatorModal');
if (genModal) {
  genModal.addEventListener('click', e => {
    if (e.target.id === 'generatorModal') {
      genModal.classList.add('hidden');
    }
  });
}

// --- openEditModal 함수 ---
async function openEditModal(uid) {
  // 현재 entries 배열은 전역 loadAndRenderList에서 저장해야 합니다
  const entry = currentEntries.find(e => (e.UID||e.id||e.uid) === uid);
  if (!entry) return;

  // 모달 보이기 & 중앙 정렬
  editModal.classList.remove('hidden');
  editModal.classList.add('flex');  // hidden 해제 후 flex로 중앙 배치



  // 폼 초기화
  editForm.innerHTML = '';

  // 1) Label + Favorite
  const lblDiv = document.createElement('div');
  lblDiv.className = 'mb-4 flex items-center space-x-2';
  lblDiv.innerHTML = `
    <input id="edit-label" type="text" value="${entry.label||''}"
      class="flex-1 border rounded px-2 py-1" />
    <i id="edit-fav-icon"
       class="fa-star ${entry.favorite ? 'fa-solid text-yellow-500' : 'fa-regular text-gray-400'} cursor-pointer text-xl"></i>
  `;
  editForm.appendChild(lblDiv);

  // favorite 토글
  const favIcon = lblDiv.querySelector('#edit-fav-icon');
  favIcon.addEventListener('click', () => {
    entry.favorite = !entry.favorite;
    favIcon.classList.toggle('fa-solid', entry.favorite);
    favIcon.classList.toggle('fa-regular', !entry.favorite);
    favIcon.classList.toggle('text-yellow-500', entry.favorite);
    favIcon.classList.toggle('text-gray-400', !entry.favorite);
  });

  // 2) 타입별 세부 입력란
  const typeFields = {
    wifi: [
      ['Name', 'name', 'text'],
      ['Password', 'pwd', 'password']
    ],
    server: [
      ['ID', 'id', 'text'],
      ['Password', 'pwd', 'password'],
      ['Host', 'host', 'text'],
      ['Port', 'port', 'number']
    ],
    bankbook: [
      ['Account Number', 'num', 'text'],
      ['Account Password', 'pwd', 'password'],
      ['Bank Name', 'bank_name', 'text'],
      ['Master', 'master', 'text']
    ],
    identity: [
      ['Citizen ID', 'citizen', 'text'],
      ['Name', 'name', 'text'],
      ['English Name', 'eng_name', 'text'],
      ['Address', 'address', 'text'],
      ['Birth Date', 'birth_date', 'date']
    ],
    security: [
      ['Content', 'content', 'textarea']
    ],
    website: [
      ['URL', 'url', 'url'],
      ['ID', 'id', 'text'],
      ['Password', 'pwd', 'password'],
      ['Email', 'email', 'email']
    ],
    card: [
      ['Card Number', 'card_number', 'text'],
      ['CVC', 'cvc', 'text'],
      ['Expiry Date', 'last_day', 'month'],
      ['Bank Name', 'bank_name', 'text'],
      ['Card Password', 'pwd', 'password'],
      ['Name on Card', 'name', 'text']
    ]
  };

  (typeFields[entry.type] || []).forEach(([label, key, inputType]) => {
    const div = document.createElement('div');
    div.className = 'mb-4';
    if (inputType === 'textarea') {
      div.innerHTML = `
        <label class="block text-sm font-medium">${label}</label>
        <textarea id="edit-${key}" class="mt-1 w-full border rounded px-2 py-1">${entry[key]||''}</textarea>
      `;
    } else if (inputType === 'password') {
      div.innerHTML = `
        <label class="block text-sm font-medium">${label}</label>
        <div class="relative">
          <input id="edit-${key}" type="password"
            value="${entry[key]||''}"
            class="mt-1 w-full border rounded px-2 py-1 pr-10" />
          <button type="button"
            id="toggle-${key}"
            class="absolute inset-y-0 right-0 pr-3 flex items-center">
            <i class="fa fa-eye-slash text-gray-500"></i>
          </button>
        </div>`;
    } else {
      div.innerHTML = `
        <label class="block text-sm font-medium">${label}</label>
        <input id="edit-${key}" type="${inputType}"
          value="${entry[key]||''}"
          class="mt-1 w-full border rounded px-2 py-1" />
      `;
    }
    editForm.appendChild(div);
    // Toggle visibility for password field
    if (inputType === 'password') {
      const toggleBtn = document.getElementById(`toggle-${key}`);
      const pwdInput  = document.getElementById(`edit-${key}`);
      const icon      = toggleBtn.querySelector('i');
      toggleBtn.addEventListener('click', () => {
        if (pwdInput.type === 'password') {
          pwdInput.type = 'text';
          icon.classList.replace('fa-eye-slash', 'fa-eye');
        } else {
          pwdInput.type = 'password';
          icon.classList.replace('fa-eye', 'fa-eye-slash');
        }
      });
    }
  });

  // Load actual password into the password input
  try {
    const pwdRes = await window.electronAPI.getPasswordDetail({ UID: uid });
    if (pwdRes.status) {
      const pwdInput = document.getElementById('edit-pwd');
      if (pwdInput) pwdInput.value = pwdRes.data.pwd || '';
    } else {
      showToast('비밀번호 불러오기 실패: ' + pwdRes.error_message, 'error');
    }
  } catch (e) {
    showToast('비밀번호 불러오기 오류', 'error');
  }


  // 3) Comments
  const commentsDiv = document.createElement('div');
  commentsDiv.className = 'mb-4';
  commentsDiv.innerHTML = `
    <label class="block text-sm font-medium">Comments</label>
    <textarea id="edit-comments" class="mt-1 w-full border rounded px-2 py-1">${
      entry.comments||''
  }</textarea>
  `;
  editForm.appendChild(commentsDiv);

  // 이벤트: 저장 / 취소
  saveEdit.onclick = async () => {
    const updated = { UID: uid };
    updated.label = document.getElementById('edit-label').value.trim();
    updated.comments = document.getElementById('edit-comments').value.trim();
    updated.favorite = entry.favorite.toString();

    (typeFields[entry.type] || []).forEach(([_, key]) => {
      updated[key] = document.getElementById(`edit-${key}`).value;
    });

    console.log('✏️ 수정 핸들러 실행, updated=', updated);

    try {
      const res = await window.electronAPI.updatePasswordEntry(updated);
      if (!res.status) throw new Error(res.error_message);
      editModal.classList.add('hidden');
      const prevScroll = container.scrollTop;
      await loadAndRenderList(searchInput?.value || '');
      container.scrollTop = prevScroll;
    } catch (err) {
      alert('수정 실패: ' + err.message);
    }
  };

  cancelEdit.onclick = () => {
    editModal.classList.add('hidden');
  };

  // addPasswordModal 내 입력란
  modalBox.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveBtn.click();
    }
  });

  // editModal 내 입력란
  editModal.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveEdit.click();
    }
  });
}
