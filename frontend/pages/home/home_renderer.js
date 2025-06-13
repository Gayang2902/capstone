
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
navHome.addEventListener('click', () => { goTo('home'); loadAndRenderList(); });
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
  if (e.target === addModal) closeModal();
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

  try {
    const res = await window.electronAPI.createPasswordEntry(data);
    if (!res.status) {
      alert('저장에 실패했습니다: ' + res.error_message);
      return;
    }
    closeModal();
    // 저장 후에도 현재 검색어를 기준으로 다시 렌더링
    loadAndRenderList(searchInput?.value || '');
  } catch (err) {
    alert('저장 중 오류가 발생했습니다:\n' + (err.message || err));
  }
});

// ─────────────────────────────────────────────────────────────
// ===== 5) 전체 비밀번호 가져와서 렌더링 =====
// ─────────────────────────────────────────────────────────────
async function loadAndRenderList(query = '') {
  // 함수 진입 시 로그
  console.log('[home_renderer] ▶ loadAndRenderList 호출, query =', query);
  console.log('[home_renderer]    현재 dataset.page =', document.body.dataset.page);

  // ─── 홈 화면이 아닐 땐 바로 돌아가기 (디버깅 후에도 남겨두세요)
  if (document.body.dataset.page !== 'home') {
    console.log('[home_renderer]    home 아님, 리턴');
    return;
  }

  // ─── 컨테이너/메시지 요소가 반드시 있어야만 진행 ───────────────────
  const container = document.getElementById('card-container');
  const emptyMsg  = document.getElementById('empty-msg');
  if (!container || !emptyMsg) return;

  // ─── 기존 로딩 메시지 세팅 ───────────────────────────────────────
  container.innerHTML = '';
  emptyMsg.textContent = '로딩 중...';

  let res;
  try {
    res = await window.electronAPI.getAllPasswords();
  } catch (err) {
    emptyMsg.textContent = '불러오기 예외: ' + err.message;
    return;
  }
  if (!res.status) {
    emptyMsg.textContent = '불러오기 실패: ' + res.error_message;
    return;
  }

  currentEntries = Array.isArray(res.data?.data) ? res.data.data : [];
  // 즐겨찾기(favorite===true)인 항목을 맨 위로 올립니다.
  let entries = currentEntries.slice().sort((a, b) => {
    const fa = (a.favorite === 'true' || a.favorite === true) ? 1 : 0;
    const fb = (b.favorite === 'true' || b.favorite === true) ? 1 : 0;
    return fb - fa;
  });

  if (query) {
    const lower = query.toLowerCase();
    entries = entries.filter(e =>
        Object.values(e).some(v => String(v).toLowerCase().includes(lower))
    );
  }
  if (!entries.length) {
    emptyMsg.textContent = '저장된 비밀번호가 없습니다.';
    return;
  }
  emptyMsg.style.display = 'none';

  entries.forEach(entry => {
    // 7개 컬럼: 10%,20%,20%,15%,15%,10%,10%
    const card = document.createElement('div');
    card.className =
        'grid grid-cols-[5%,20%,20%,15%,20%,8%,7%] items-center ' +
        'p-4 bg-white rounded-lg shadow w-full gap-x-4 ' +
        'transition-colors duration-200 ease-in-out ' +   // → 색 변화 애니메이션
        'hover:bg-indigo-50 hover:shadow-lg';              // → 호버 시 배경·그림자 변화

    // ① 아이콘 셀 (website 타입만 파비콘 로드)
    const iconCell = document.createElement('div');
    iconCell.className = 'w-12 h-12';
    let iconEl;
    if (entry.type === 'website') {
      // URL에서 호스트 추출
      let domain;
      try {
        domain = new URL(entry.url).hostname;
      } catch (e) {
        domain = entry.url.replace(/^https?:\/\//, '').split('/')[0];
      }
      // Clearbit Logo API 사용
      iconEl = document.createElement('img');
      iconEl.src = `https://logo.clearbit.com/${domain}?size=64`;
      iconEl.alt = 'favicon';
      iconEl.className = 'w-full h-full object-contain';
    } else {
      iconEl = document.createElement('img');
      iconEl.src = `../icon/${entry.type === 'wifi' ? 'wifi' : entry.type}.png`;
      iconEl.alt = entry.type;
      iconEl.className = 'w-full h-full object-contain';
    }
    iconCell.appendChild(iconEl);
    card.appendChild(iconCell);

    // ② 레이블 + 서브텍스트 셀
    const labelCell = document.createElement('div');
    labelCell.className = 'flex flex-col';
    const lbl = document.createElement('span');
    lbl.className = 'font-semibold';
    lbl.textContent = entry.type === 'card' ? entry.bank_name : entry.label;
    const sub = document.createElement('span');
    sub.className = 'text-xs text-gray-500';
    switch (entry.type) {
      case 'website':   sub.textContent = entry.url; break;
      case 'server':    sub.textContent = `Host: ${entry.host} Port: ${entry.port}`; break;
      case 'bankbook':  sub.textContent = `Bank: ${entry.bank_name}`; break;
      case 'identity':  sub.textContent = `Eng: ${entry.eng_name}`; break;
      case 'card':      sub.textContent = `CVC: ${entry.cvc}`; break;
      default:          sub.textContent = '';
    }
    labelCell.append(lbl, sub);
    card.appendChild(labelCell);

    // 준비: 필드 값 배열 (최대 3)
    const mask = () => '****';
    let fields = [];
    if (entry.type === 'website') {
      fields = [['ID:', entry.id], ['PWD:', mask()], ['E-Mail:', entry.email]];
    } else if (entry.type === 'server') {
      fields = [['ID:', entry.id], ['PWD:', mask()], ['', '']];
    } else if (entry.type === 'bankbook') {
      fields = [['Num:', entry.num], ['PWD:', mask()], ['', '']];
    } else if (entry.type === 'identity') {
      fields = [['Name:', entry.name], ['Citizen:', entry.citizen], ['', '']];
    } else if (entry.type === 'card') {
      fields = [['Num:', entry.card_number], ['PWD:', mask()], ['', '']];
    } else if (entry.type === 'wifi') {
      fields = [['ID:', entry.name], ['PWD:', mask()], ['', '']];
    } else if (entry.type === 'security') {
      fields = [[' ', entry.content], ['', ''], ['', '']];
    }

    // ③~⑤ 필드 셀 with copy & hover for ID/PWD
    for (let i = 0; i < 3; i++) {
      const [key, val] = fields[i] || ['', ''];
      const cell = document.createElement('div');
      if (key) {
        const labelEl = document.createElement('strong');
        labelEl.textContent = key;
        const valueSpan = document.createElement('span');
        valueSpan.className = 'field-value draggable-text ml-1 cursor-pointer select-none';
        if (key.startsWith('PWD')) {
          valueSpan.innerText = '****';
          // hover to reveal
          let revealedPwd = null;
          valueSpan.addEventListener('mouseenter', async () => {
            try {
              const res = await window.electronAPI.getPasswordDetail({ UID: entry.UID });
              if (res.status) {
                if (res.data.pwd) {
                  revealedPwd = res.data.pwd;
                  valueSpan.textContent = revealedPwd;
                } else {
                  showToast('저장된 비밀번호가 없습니다.', 'error');
                }
              } else {
                showToast('비밀번호 가져오기 실패: ' + res.error_message, 'error');
              }
            } catch {
              showToast('비밀번호 가져오기 오류', 'error');
            }
          });
          // hide on leave
          valueSpan.addEventListener('mouseleave', () => {
            valueSpan.textContent = '****';
            revealedPwd = null;
          });
          // click to copy revealed or fetch if not present
          valueSpan.addEventListener('click', async e => {
            e.stopPropagation();
            try {
              const pwdToCopy = revealedPwd || (await window.electronAPI.getPasswordDetail({ UID: entry.UID })).data.pwd;
              await navigator.clipboard.writeText(pwdToCopy);
              showToast('비밀번호 복사됨');
              valueSpan.classList.add('text-green-400');
              setTimeout(() => valueSpan.classList.remove('text-green-400'), 3000);
              // clear system clipboard after 30s
              window.electronAPI.writeClipboard(pwdToCopy);
            } catch (err) {
              showToast('복사 오류', 'error');
            }
          });
        } else if (key.startsWith('ID')) {
          valueSpan.textContent = val;
          valueSpan.addEventListener('click', (e) => {
            e.stopPropagation();
            navigator.clipboard.writeText(val)
                .then(() => {
                  showToast('ID 복사됨');
                  valueSpan.classList.add('text-green-400');
                  setTimeout(() => valueSpan.classList.remove('text-green-400'), 3000);
                })
                .catch(() => showToast('복사 실패', 'error'));
          });
        } else {
          valueSpan.textContent = val;
        }
        cell.append(labelEl, valueSpan);
      }
      card.appendChild(cell);
    }

    // ⑥ 타입 셀
    const typeCell = document.createElement('span');
    typeCell.className = 'text-xs text-gray-400';
    typeCell.textContent = `${entry.type}`;
    card.appendChild(typeCell);

    // ⑦ 삭제 버튼 셀
    // ⑦ 액션 버튼 셀: 즐겨찾기 토글 + 삭제
    const actionCell = document.createElement('div');
    actionCell.className = 'flex items-center space-x-2';

    // (가) 즐겨찾기 토글 버튼
    const favBtn = document.createElement('button');
    favBtn.className = 'focus:outline-none';
    const favIcon = document.createElement('i');
    favIcon.className = (entry.favorite === 'true' || entry.favorite === true)
        ? 'fa-solid fa-star text-yellow-500 text-lg'
        : 'fa-regular fa-star text-gray-400 text-lg';
    favBtn.appendChild(favIcon);
    favBtn.addEventListener('click', async e => {
      e.stopPropagation();
      const newFav = !(entry.favorite === 'true' || entry.favorite === true);
      try {
        // API에 favorite=true/false 업데이트
        await window.electronAPI.updatePasswordEntry({
          UID: entry.UID,
          favorite: newFav.toString()
        });
        entry.favorite = newFav;
        // 아이콘 모양 업데이트
        favIcon.className = newFav
            ? 'fa-solid fa-star text-yellow-500 text-lg'
            : 'fa-regular fa-star text-gray-400 text-lg';
        // 맨 위로 고정: favorite=true면 prepend
        if (newFav) container.prepend(card);
        showToast(`즐겨찾기 ${newFav ? '추가' : '해제'}`);
      } catch (err) {
        showToast('즐겨찾기 업데이트 실패', 'error');
      }
    });
    actionCell.appendChild(favBtn);

    // (나) 삭제 버튼
    const delBtn = document.createElement('button');
    delBtn.className = 'text-red-500 hover:underline';
    delBtn.textContent = '삭제';
    delBtn.addEventListener('click', async e => {
      e.stopPropagation();
      if (!confirm('정말 삭제하시겠습니까?')) return;
      await window.electronAPI.deletePasswordEntry(entry.UID);
      loadAndRenderList(query);
    });
    actionCell.appendChild(delBtn);

    card.appendChild(actionCell);
    card.addEventListener('click', () => openEditModal(entry.UID));
    container.appendChild(card);
  });
}

// === 여기에 openEditModal 붙여넣기 ===
// ====================================
function openEditModal(uid) {
  // 1) 해당 UID를 가진 entry 찾아오기
  const entry = currentEntries.find(e => e.UID === uid);
  if (!entry) return;

  // 2) 모달 보이기
  editModal.classList.remove('hidden');
  editModal.classList.add('flex');
  // 배경 클릭 시 닫기
  editModal.addEventListener('click', e => {
    if (e.target === editModal) {
      editModal.classList.add('hidden');
      editModal.classList.remove('flex');
    }
  }, { once: true });

  // 3) 폼 초기화
  editForm.innerHTML = '';

  // 4) Label + Favorite 아이콘
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

  // 5) 타입별 필드 자동 생성
  const typeFields = {
    wifi:     [['Name','name','text'], ['Password','pwd','password']],
    server:   [['ID','id','text'], ['Password','pwd','password'], ['Host','host','text'], ['Port','port','number']],
    bankbook: [['Account Number','num','text'], ['Account Password','pwd','password'], ['Bank Name','bank_name','text'], ['Master','master','text']],
    identity: [['Citizen ID','citizen','text'], ['Name','name','text'], ['English Name','eng_name','text'], ['Address','address','text'], ['Birth Date','birth_date','date']],
    security: [['Content','content','textarea']],
    website:  [['URL','url','url'], ['ID','id','text'], ['Password','pwd','password'], ['Email','email','email']],
    card:     [['Card Number','card_number','text'], ['CVC','cvc','text'], ['Expiry Date','last_day','month'], ['Bank Name','bank_name','text'], ['Card Password','pwd','password'], ['Name on Card','name','text']],
  };
  (typeFields[entry.type]||[]).forEach(([label,key,inputType]) => {
    const div = document.createElement('div');
    div.className = 'mb-4';
    if (inputType === 'textarea') {
      div.innerHTML = `
          <label class="block text-sm font-medium">${label}</label>
          <textarea id="edit-${key}" class="mt-1 w-full border rounded px-2 py-1">${entry[key]||''}</textarea>`;
    } else {
      div.innerHTML = `
          <label class="block text-sm font-medium">${label}</label>
          <input id="edit-${key}" type="${inputType}"
                 value="${entry[key]||''}"
                 class="mt-1 w-full border rounded px-2 py-2" />`;
    }
    editForm.appendChild(div);
  });

  // 6) Comments 필드
  const commentsDiv = document.createElement('div');
  commentsDiv.className = 'mb-4';
  commentsDiv.innerHTML = `
      <label class="block text-sm font-medium">Comments</label>
      <textarea id="edit-comments" class="mt-1 w-full border rounded px-2 py-1">${entry.comments||''}</textarea>`;
  editForm.appendChild(commentsDiv);

  // 7) 저장 & 취소 이벤트
  saveEdit.onclick = async () => {
    const updated = {
      UID: uid,
      label: document.getElementById('edit-label').value.trim(),
      comments: document.getElementById('edit-comments').value.trim(),
      favorite: entry.favorite.toString()
    };
    (typeFields[entry.type]||[]).forEach(([_,key]) => {
      updated[key] = document.getElementById(`edit-${key}`).value;
    });
    try {
      const res = await window.electronAPI.updatePasswordEntry(updated);
      if (!res.status) throw new Error(res.error_message);
      editModal.classList.add('hidden');
      await loadAndRenderList(searchInput?.value || '');
    } catch (err) {
      alert('수정 실패: ' + err.message);
    }
  };
  cancelEdit.onclick = () => {
    editModal.classList.add('hidden');
  };
}



// ==================================== 비밀번호 업데이트 ==============================================
// 모달 바깥 클릭 시 닫기
editModal.addEventListener('click', e => {
  if (e.target === editModal) editModal.classList.add('hidden');
});
// 취소 버튼
cancelEdit.addEventListener('click', () => {
  editModal.classList.add('hidden');
});

// --- openEditModal 함수 ---
function openEditModal(uid) {
  // 현재 entries 배열은 전역 loadAndRenderList에서 저장해야 합니다
  const entry = currentEntries.find(e => (e.UID||e.id||e.uid) === uid);
  if (!entry) return;

  // 모달 보이기 & 중앙 정렬
  editModal.classList.remove('hidden');
  editModal.classList.add('flex');  // hidden 해제 후 flex로 중앙 배치

  // 클릭 영역 눌러서 닫기
  editModal.addEventListener('click', (e) => {
    if (e.target === editModal) {
      editModal.classList.add('hidden');
      editModal.classList.remove('flex');
    }
  }, { once: true });

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
    } else {
      div.innerHTML = `
        <label class="block text-sm font-medium">${label}</label>
        <input id="edit-${key}" type="${inputType}"
          value="${entry[key]||''}"
          class="mt-1 w-full border rounded px-2 py-1" />
      `;
    }
    editForm.appendChild(div);
  });

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
    updated.label    = document.getElementById('edit-label').value.trim();
    updated.comments = document.getElementById('edit-comments').value.trim();
    updated.favorite = entry.favorite.toString();

    (typeFields[entry.type] || []).forEach(([_, key]) => {
      updated[key] = document.getElementById(`edit-${key}`).value;
    });

    try {
      const res = await window.electronAPI.updatePasswordEntry(updated);
      if (!res.status) throw new Error(res.error_message);
      editModal.classList.add('hidden');
      await loadAndRenderList();
    } catch (err) {
      alert('수정 실패: ' + err.message);
    }
  };

  cancelEdit.onclick = () => {
    editModal.classList.add('hidden');
  };
}
