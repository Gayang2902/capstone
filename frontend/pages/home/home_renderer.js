// File: pages/home/home_renderer.js

// ─────────────────────────────────────────────────────────────
// ======== 0) 전역 변수 ========
const navHome    = document.getElementById('navHome');
const navStats   = document.getElementById('navStats');
const navGroup   = document.getElementById('navGroup');
const navSetting = document.getElementById('navSetting');
const mainContent = document.getElementById('main-content');
const btnScreenshotPrevent = document.getElementById('btnScreenshotPrevent');

// Add Password Modal 관련
const addModal      = document.getElementById('addPasswordModal');
const modalBox      = document.getElementById('modalBox');
const cancelBtn     = document.getElementById('cancelBtn');
const backBtn       = document.getElementById('backBtn');
const typeSelection = document.getElementById('type-selection');
const formContainer = document.getElementById('dynamicForm');
const saveBtn       = document.getElementById('saveBtn');

// “favorite” 상태 추적 (별 아이콘 토글용)
let favorite = false;
let selectedType = null;

// ─────────────────────────────────────────────────────────────
// ======== 1) 페이지 초기화 ========
window.addEventListener('DOMContentLoaded', () => {
  // (1) 네비게이션 버튼 하이라이트
  setActiveButton(navHome);

  // (2) 스크린샷 방지 기본 적용
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

  // (3) 페이지 로드 직후 비밀번호 목록을 가져와서 테이블을 채운다
  loadAndRenderList();

  // (4) “+” 버튼 누르면 모달 열기
  const addBtnInHome = document.getElementById('filterAddBtnInner');
  if (addBtnInHome) {
    addBtnInHome.addEventListener('click', openModal);
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
      data.accountNum = document.getElementById('bankbook-account-num').value.trim();
      data.accountPwd = document.getElementById('bankbook-account-pwd').value.trim();
      data.bankName   = document.getElementById('bankbook-bank-name').value.trim();
      data.master     = document.getElementById('bankbook-master').value.trim();
      if (!data.accountNum || !data.accountPwd || !data.bankName || !data.master) {
        alert('모든 필드를 입력해주세요.');
        return;
      }
      break;
    case 'identity':
      data.citizen   = document.getElementById('identity-citizen').value.trim();
      data.name      = document.getElementById('identity-name').value.trim();
      data.engName   = document.getElementById('identity-eng-name').value.trim();
      data.address   = document.getElementById('identity-address').value.trim();
      data.birthDate = document.getElementById('identity-birth-date').value;
      if (!data.citizen || !data.name || !data.engName || !data.address || !data.birthDate) {
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
      data.cardNumber = document.getElementById('card-number').value.trim();
      data.cvc        = document.getElementById('card-cvc').value.trim();
      data.expiry     = document.getElementById('card-expiry').value;
      data.cardBank   = document.getElementById('card-bank-name').value.trim();
      data.cardPwd    = document.getElementById('card-pwd').value.trim();
      data.cardName   = document.getElementById('card-name').value.trim();
      if (!data.cardNumber || !data.cvc || !data.expiry || !data.cardBank || !data.cardPwd || !data.cardName) {
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
    loadAndRenderList();
  } catch (err) {
    alert('저장 중 오류가 발생했습니다:\n' + (err.message || err));
  }
});

// ─────────────────────────────────────────────────────────────
// ===== 5) 전체 비밀번호 가져와서 렌더링 =====
// ─────────────────────────────────────────────────────────────
// ───── (1) 비밀번호 리스트를 가져오는 함수 ─────
async function loadAndRenderList(query = '') {
  const pwList   = document.getElementById('pw-list');      // <tbody> 요소
  const emptyMsg = document.getElementById('empty-msg');     // 빈 메시지 td

  // 1) 초기화: “로딩 중...” 텍스트 표시
  pwList.innerHTML = '';
  emptyMsg.textContent = '로딩 중...';
  emptyMsg.style.display = '';

  let res;
  try {
    // IPC를 통해 백엔드로부터 모든 비밀번호를 가져온다
    res = await window.electronAPI.getAllPasswords();
  } catch (err) {
    emptyMsg.textContent = '불러오기 예외: ' + err.message;
    return;
  }

  // 2) 응답 검사
  if (!res.status) {
    emptyMsg.textContent = '불러오기 실패: ' + res.error_message;
    return;
  }

  // 3) 실제 비밀번호 배열은 res.data.data에 들어있다
  //    (백엔드에서 { data: { data: [ … ] }, status: true } 형태로 반환되었기 때문)
  const dataArray = Array.isArray(res.data?.data) ? res.data.data : [];

  // 4) 검색 필터(선택 사항)
  let entries = dataArray;
  if (query) {
    const lower = query.toLowerCase();
    entries = entries.filter(entry =>
        // entry의 모든 값 중 하나라도 검색어를 포함하면 필터링 통과
        Object.values(entry).some(val =>
            String(val).toLowerCase().includes(lower)
        )
    );
  }

  // 5) 데이터가 없으면 “저장된 비밀번호가 없습니다.” 표시 후 종료
  if (entries.length === 0) {
    emptyMsg.textContent = '저장된 비밀번호가 없습니다.';
    return;
  }

  // 6) 데이터가 있으면 “로딩 중” 메시지 숨기고, 테이블에 행을 추가
  emptyMsg.style.display = 'none';

  entries.forEach(entry => {
    // ─── 6.1) <tr> 요소 생성 ───
    const tr = document.createElement('tr');

    // ─── 6.2) Label 컬럼 ───
    const tdLabel = document.createElement('td');
    tdLabel.className = 'border px-4 py-2';
    tdLabel.textContent = entry.label || '';
    tr.appendChild(tdLabel);

    // ─── 6.3) Type 컬럼 (필요 없으면 이 부분을 삭제해도 됩니다) ───
    const tdType = document.createElement('td');
    tdType.className = 'border px-4 py-2';
    tdType.textContent = entry.type || '';
    tr.appendChild(tdType);

    // ─── 6.4) Details 컬럼: “UID, created_at, modified_at, favorite, type” 제외 ───
    const tdDetails = document.createElement('td');
    tdDetails.className = 'border px-4 py-2';

    // 출력하지 않을 필드 키 배열 (대문자 UID, created_at 등)
    const hiddenKeys = ['UID', 'created_at', 'modified_at', 'favorite', 'type', 'label'];

    const detailLines = [];
    Object.entries(entry).forEach(([key, val]) => {
      if (hiddenKeys.includes(key)) return;
      // 예: key="host", val="redsnowz.kr"
      detailLines.push(`<strong>${key}:</strong> ${val}`);
    });

    tdDetails.innerHTML = detailLines.join('<br>');
    tr.appendChild(tdDetails);

    // ─── 6.5) Actions 컬럼 (수정 / 삭제 버튼) ───
    const tdActions = document.createElement('td');
    tdActions.className = 'border px-4 py-2 space-x-2';
    tdActions.innerHTML = `
      <button class="btn-edit px-2 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600">
        수정
      </button>
      <button class="btn-del px-2 py-1 bg-red-500 text-white rounded-md hover:bg-red-600">
        삭제
      </button>
    `;
    tr.appendChild(tdActions);

    // ─── 6.6) 삭제 버튼 클릭 시 ───
    tr.querySelector('.btn-del').addEventListener('click', async () => {
      if (!confirm('정말 삭제하시겠습니까?')) return;

      // 수정된 형태: uid를 문자열 그대로 넘김
      await window.electronAPI.deletePasswordEntry(entry.UID);

      loadAndRenderList(query);
    });


    // ─── 6.7) 수정 버튼 클릭 시 (레이블만 변경하는 예시) ───
    tr.querySelector('.btn-edit').addEventListener('click', async () => {
      const newLabel = prompt('새 레이블을 입력하세요', entry.label);
      if (newLabel === null) return;
      await window.electronAPI.updatePasswordEntry({ uid: entry.UID, label: newLabel });
      loadAndRenderList(query);
    });

    pwList.appendChild(tr);
  });
}

// 페이지 로드 시 한 번 실행
window.addEventListener('DOMContentLoaded', () => {
  loadAndRenderList();
});