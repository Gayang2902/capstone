// File: pages/home/home_renderer.js

// ─────────────────────────────────────────────────────────────
// ======== 0) 전역 변수 ========
// 전역 변수: navigation 버튼들 (shared_renderer.js에서 goTo를 지원)
// ─────────────────────────────────────────────────────────────
const navHome    = document.getElementById('navHome');
const navStats   = document.getElementById('navStats');
const navGroup   = document.getElementById('navGroup');
const navSetting = document.getElementById('navSetting');
const mainContent = document.getElementById('main-content');

// “스크린샷 방지” 버튼
const btnScreenshotPrevent = document.getElementById('btnScreenshotPrevent');


// ─────────────────────────────────────────────────────────────
// ======== 1) 페이지 초기화 ========
// 페이지 초기화: Home 화면 로드, 네비 하이라이트 & 스크린샷 토글
// ─────────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  // 네비 하이라이트
  setActiveButton(navHome);
  loadHome();

  // 스크린샷 토글 로직 초기화
  let screenshotBlocked = true;
  // 초기 화면 로드 시 스크린샷 방지 모드 적용
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
});


// ─────────────────────────────────────────────────────────────
// ======== 2) 네비 버튼 하이라이트 & 페이지 로드 함수 ========
// ─────────────────────────────────────────────────────────────
function setActiveButton(btn) {
  document.querySelectorAll('.nav-btn').forEach(b => {
    b.classList.remove('bg-indigo-100', 'text-indigo-800', 'shadow-lg');
  });
  btn.classList.add('bg-indigo-100', 'text-indigo-800', 'shadow-lg');
}

function loadHtmlIntoMain(url) {
  fetch(url)
      .then(response => {
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        return response.text();
      })
      .then(html => {
        mainContent.innerHTML = html;
      })
      .catch(err => {
        console.error('HTML 가져오는 중 오류:', err);
        mainContent.innerHTML = `<p class="text-red-500">컨텐츠를 불러올 수 없습니다.</p>`;
      });
}

function loadHome() {
  mainContent.innerHTML = `
    <div class="mt-8">
      <div class="flex justify-between items-start mb-4">
        <div class="flex space-x-3">
          <button
            class="px-5 py-2 bg-gradient-to-br from-indigo-500 to-purple-500 text-white
                   rounded-2xl shadow-md transition hover:from-indigo-600 hover:to-purple-600
                   active:scale-95 focus:outline-none"
          >
            전체
          </button>
        </div>
        <div class="flex items-center space-x-2">
          <button
            id="filterAddBtnInner"
            class="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-full shadow-md transition 
               hover:from-indigo-600 hover:to-indigo-800 active:scale-95 focus:outline-none"
            title="새 비밀번호 추가"
          >
            <i class="fa-solid fa-plus text-white text-lg"></i>
          </button>
          <button
            class="px-5 py-2 bg-gradient-to-br from-indigo-500 to-purple-500 text-white
                   rounded-2xl shadow-md transition hover:from-indigo-600 hover:to-purple-600
                   active:scale-95 focus:outline-none"
          >
            추가순
          </button>
        </div>
      </div>

      <!-- 실제 목록을 렌더링할 테이블 -->
      <div class="overflow-auto bg-white rounded-lg shadow">
        <table class="min-w-full bg-white">
          <thead class="bg-gray-200">
            <tr>
              <th class="px-4 py-2 text-left">Label</th>
              <th class="px-4 py-2 text-left">Type</th>
              <th class="px-4 py-2 text-left">Details</th>
              <th class="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody id="pw-list">
            <tr>
              <td id="empty-msg" colspan="4" class="text-center text-gray-500 italic py-4">
                로딩 중...
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  // Home 내부 + 버튼 클릭 시 모달 열기 바인딩
  const addBtnInHome = document.getElementById('filterAddBtnInner');
  if (addBtnInHome) {
    addBtnInHome.addEventListener('click', openModal);
  }

  // 초기 로드시 비밀번호 목록 불러오기
  loadAndRenderList();
}

// 네비게이션 버튼 이벤트 바인딩
navHome.addEventListener('click', () => {
  goTo('home');
  loadHome();
});
navStats.addEventListener('click', () => goTo('statistic'));
navGroup.addEventListener('click', () => goTo('group'));
navSetting.addEventListener('click', () => goTo('setting'));


// ─────────────────────────────────────────────────────────────
// ======== 3) “비밀번호 추가” 모달 열기/닫기 & 동적 폼 로직 ========
// ─────────────────────────────────────────────────────────────
const addModal      = document.getElementById('addPasswordModal');
const modalBox      = document.getElementById('modalBox');
const cancelBtn     = document.getElementById('cancelBtn');
const backBtn       = document.getElementById('backBtn');
const typeSelection = document.getElementById('type-selection');
const formContainer = document.getElementById('dynamicForm');
const saveBtn       = document.getElementById('saveBtn');

function openModal() {
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

let selectedType = null;
const typeButtons = {
  wifi:     document.getElementById('type-wifi'),
  server:   document.getElementById('type-server'),
  bankbook: document.getElementById('type-bankbook'),
  identity: document.getElementById('type-identity'),
  security: document.getElementById('type-security'),
  website:  document.getElementById('type-website'),
  card:     document.getElementById('type-card'),
};

const formTemplates = {
  wifi: `
    <div>
      <label class="block text-sm font-medium text-gray-700">Name</label>
      <input type="text" id="wifi-name" required
             class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:outline-none"
             placeholder="Wi-Fi 이름" />
    </div>
    <div>
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
    <div>
      <label class="block text-sm font-medium text-gray-700">Password</label>
      <input type="password" id="server-pwd" required
             class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:outline-none"
             placeholder="서버 비밀번호" />
    </div>
    <div>
      <label class="block text-sm font-medium text-gray-700">Host</label>
      <input type="text" id="server-host" required
             class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:outline-none"
             placeholder="서버 호스트" />
    </div>
    <div>
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
    <div>
      <label class="block text-sm font-medium text-gray-700">Account Password</label>
      <input type="password" id="bankbook-account-pwd" required
             class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:outline-none"
             placeholder="계좌 비밀번호" />
    </div>
    <div>
      <label class="block text-sm font-medium text-gray-700">Bank Name</label>
      <input type="text" id="bankbook-bank-name" required
             class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:outline-none"
             placeholder="은행 이름" />
    </div>
    <div>
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
             class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:outline-none"
             placeholder="주민등록번호" />
    </div>
    <div>
      <label class="block text-sm font-medium text-gray-700">Name</label>
      <input type="text" id="identity-name" required
             class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:outline-none"
             placeholder="이름" />
    </div>
    <div>
      <label class="block text-sm font-medium text-gray-700">English Name</label>
      <input type="text" id="identity-eng-name" required
             class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:outline-none"
             placeholder="영문 이름" />
    </div>
    <div>
      <label class="block text-sm font-medium text-gray-700">Address</label>
      <input type="text" id="identity-address" required
             class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:outline-none"
             placeholder="주소" />
    </div>
    <div>
      <label class="block text-sm font-medium text-gray-700">Birth Date</label>
      <input type="date" id="identity-birth-date" required
             class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:outline-none"
      />
    </div>
  `,
  security: `
    <div>
      <label class="block text-sm font-medium text-gray-700">Content</label>
      <textarea id="security-content" rows="4" required
                class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="보안 관련 내용"></textarea>
    </div>
  `,
  website: `
    <div>
      <label class="block text-sm font-medium text-gray-700">URL</label>
      <input type="url" id="website-url" required
             class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:outline-none"
             placeholder="https://example.com" />
    </div>
    <div>
      <label class="block text-sm font-medium text-gray-700">ID</label>
      <input type="text" id="website-id" required
             class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:outline-none"
             placeholder="웹사이트 ID" />
    </div>
    <div>
      <label class="block text-sm font-medium text-gray-700">Password</label>
      <input type="password" id="website-pwd" required
             class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:outline-none"
             placeholder="웹사이트 비밀번호" />
    </div>
    <div>
      <label class="block 텍스트-sm font-medium text-gray-700">Email</label>
      <input type="email" id="website-email" required
             class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:outline-none"
             placeholder="이메일 주소" />
    </div>
  `,
  card: `
    <div>
      <label class="block text-sm font-medium text-gray-700">Card Number</label>
      <input type="text" id="card-number" required
             class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:outline-none"
             placeholder="카드 번호" />
    </div>
    <div>
      <label class="block text-sm font-medium text-gray-700">CVC</label>
      <input type="text" id="card-cvc" required
             class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:outline-none"
             placeholder="CVC 코드" />
    </div>
    <div>
      <label class="block text-sm font-medium text-gray-700">Expiry Date</label>
      <input type="month" id="card-expiry" required
             class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:outline-none"
      />
    </div>
    <div>
      <label class="block text-sm font-medium text-gray-700">Bank Name</label>
      <input type="text" id="card-bank-name" required
             class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:outline-none"
             placeholder="발급 은행" />
    </div>
    <div>
      <label class="block text-sm font-medium text-gray-700">Card Password</label>
      <input type="password" id="card-pwd" required
             class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:outline-none"
             placeholder="카드 비밀번호" />
    </div>
    <div>
      <label class="block text-sm font-medium text-gray-700">Name on Card</label>
      <input type="text" id="card-name" required
             class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:outline-none"
             placeholder="카드 소유자 이름" />
    </div>
  `
};

// 각 유형 버튼 클릭 시 폼 삽입
Object.entries(typeButtons).forEach(([key, btn]) => {
  btn?.addEventListener('click', () => {
    selectedType = key;
    typeSelection.classList.add('hidden');
    backBtn.classList.remove('hidden');
    formContainer.innerHTML = formTemplates[key] || '';
  });
});

// 뒤로가기 버튼 클릭 시 유형 선택 화면 복귀
backBtn.addEventListener('click', () => {
  selectedType = null;
  formContainer.innerHTML = '';
  typeSelection.classList.remove('hidden');
  backBtn.classList.add('hidden');
});

// ─────────────────────────────────────────────────────────────
// ======== 4) “저장” 버튼 클릭 시 ========
// “저장” 버튼 클릭 시 (실제 저장 로직)
// ─────────────────────────────────────────────────────────────
saveBtn.addEventListener('click', async () => {
  if (!selectedType) {
    alert('우선 유형을 선택해주세요.');
    return;
  }

  const data = { type: selectedType };

  switch (selectedType) {
    case 'wifi':
      data.name = document.getElementById('wifi-name').value.trim();
      data.pwd  = document.getElementById('wifi-pwd').value.trim();
      break;
    case 'server':
      data.id   = document.getElementById('server-id').value.trim();
      data.pwd  = document.getElementById('server-pwd').value.trim();
      data.host = document.getElementById('server-host').value.trim();
      data.port = document.getElementById('server-port').value.trim();
      break;
    case 'bankbook':
      data.accountNum = document.getElementById('bankbook-account-num').value.trim();
      data.accountPwd = document.getElementById('bankbook-account-pwd').value.trim();
      data.bankName   = document.getElementById('bankbook-bank-name').value.trim();
      data.master     = document.getElementById('bankbook-master').value.trim();
      break;
    case 'identity':
      data.citizen   = document.getElementById('identity-citizen').value.trim();
      data.name      = document.getElementById('identity-name').value.trim();
      data.engName   = document.getElementById('identity-eng-name').value.trim();
      data.address   = document.getElementById('identity-address').value.trim();
      data.birthDate = document.getElementById('identity-birth-date').value;
      break;
    case 'security':
      data.content = document.getElementById('security-content').value.trim();
      break;
    case 'website':
      data.url   = document.getElementById('website-url').value.trim();
      data.id    = document.getElementById('website-id').value.trim();
      data.pwd   = document.getElementById('website-pwd').value.trim();
      data.email = document.getElementById('website-email').value.trim();
      break;
    case 'card':
      data.cardNumber = document.getElementById('card-number').value.trim();
      data.cvc        = document.getElementById('card-cvc').value.trim();
      data.expiry     = document.getElementById('card-expiry').value;
      data.cardBank   = document.getElementById('card-bank-name').value.trim();
      data.cardPwd    = document.getElementById('card-pwd').value.trim();
      data.cardName   = document.getElementById('card-name').value.trim();
      break;
    default:
      break;
  }

  try {
    const res = await window.electronAPI.createEntry(data);
    if (!res.status) {
      console.error('저장 실패:', res.error_message);
      alert('저장에 실패했습니다: ' + res.error_message);
      return;
    }

    closeModal();
    loadAndRenderList();
  } catch (err) {
    console.error('IPC 호출 중 오류:', err);
    alert('저장 중 오류가 발생했습니다.');
  }
});


// ─────────────────────────────────────────────────────────────
// ======== 5) 전체 비밀번호 가져와서 렌더링 ========
// ─────────────────────────────────────────────────────────────
async function loadAndRenderList(query = '') {
  const pwList   = document.getElementById('pw-list');
  const emptyMsg = document.getElementById('empty-msg');

  pwList.innerHTML = '';
  emptyMsg.textContent = '로딩 중...';

  // IPC 호출: getAllPwds
  const res = await window.electronAPI.getAllPwds();
  if (!res.status) {
    emptyMsg.textContent = '불러오기 실패: ' + res.error_message;
    return;
  }

  let data = res.data;
  if (query) {
    const lower = query.toLowerCase();
    data = data.filter(entry =>
        Object.values(entry).some(val =>
            String(val).toLowerCase().includes(lower)
        )
    );
  }

  if (data.length === 0) {
    emptyMsg.textContent = '저장된 비밀번호가 없습니다.';
    return;
  }

  emptyMsg.style.display = 'none';

  data.forEach(entry => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="border px-4 py-2">${entry.label}</td>
      <td class="border px-4 py-2">${entry.type}</td>
      <td class="border px-4 py-2">
        ${Object.entries(entry)
        .filter(([k]) => !['uid','label','type'].includes(k))
        .map(([k, v]) => `<strong>${k}:</strong> ${v}`)
        .join('<br/>')}
      </td>
      <td class="border px-4 py-2 space-x-2">
        <button class="btn-edit px-2 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600">수정</button>
        <button class="btn-del px-2 py-1 bg-red-500 text-white rounded-md hover:bg-red-600">삭제</button>
      </td>
    `;

    tr.querySelector('.btn-del').addEventListener('click', async () => {
      if (!confirm('정말 삭제하시겠습니까?')) return;
      await window.electronAPI.deleteEntry({ uid: entry.uid });
      loadAndRenderList(query);
    });

    tr.querySelector('.btn-edit').addEventListener('click', async () => {
      const newLabel = prompt('새 레이블을 입력하세요', entry.label);
      if (newLabel === null) return;
      await window.electronAPI.updateEntry({ uid: entry.uid, label: newLabel });
      loadAndRenderList(query);
    });

    pwList.append(tr);
  });
}