import { openGenericModal, closeGenericModal } from './modal.js';  // 반드시 import

export function initStatisticsEvents() {
  function bindToggleEvents() {
    document.querySelectorAll('.entry-header').forEach(header => {
      header.addEventListener('click', () => {
        header.nextElementSibling.classList.toggle('hidden');
      });
    });
    document.querySelectorAll('.toggle-visibility').forEach(btn => {
      btn.addEventListener('click', () => {
        const input = btn.previousElementSibling;
        if (input.type === 'password') {
          input.type = 'text';
          btn.innerHTML = '<i class="fa-solid fa-eye-slash"></i>';
        } else {
          input.type = 'password';
          btn.innerHTML = '<i class="fa-solid fa-eye"></i>';
        }
      });
    });
  }

  // ✨ 모달 close, overlay 공통 적용 함수
  function bindModalCloseEvents() {
    document.getElementById('modalCloseBtn')?.addEventListener('click', closeGenericModal);
    document.getElementById('genericModal')?.addEventListener('click', e => {
      if (e.target.id === 'genericModal') closeGenericModal();
    });
    // ✨ modalContent에 고정 높이 + 스크롤
    const modalContent = document.getElementById('modalContent');
    modalContent.style.maxHeight = '400px';
    modalContent.style.overflowY = 'auto';
  }

  document.getElementById('viewRegeneratedBtn')?.addEventListener('click', () => {
    const data = [
      { id: 'old_pw1', password: 'new_pw1!' },
      { id: 'old_pw2', password: 'new_pw2@' },
      { id: 'old_pw3', password: 'new_pw3#' },  // 테스트용 더 추가해도 됨
      { id: 'old_pw4', password: 'new_pw4$' }
    ];
    const items = data.map(item => `
      <li class="pw-entry mb-3">
        <div class="entry-header cursor-pointer">
          <span class="id-text font-medium text-blue-700">${item.id}</span>
        </div>
        <div class="entry-body hidden mt-2">
          <div class="flex items-center">
            <input type="password" class="pw-field flex-1 px-3 py-2 rounded border border-blue-300" readonly value="${item.password}" />
            <button type="button" class="toggle-visibility ml-2 text-blue-500">
              <i class="fa-solid fa-eye"></i>
            </button>
          </div>
        </div>
      </li>`).join('');

    openGenericModal('재사용된 비밀번호', `
      <div class="bg-blue-50 border-l-4 border-blue-400 rounded-lg p-4">
        <ul class="pw-list space-y-2">${items}</ul>
      </div>
    `);

    bindModalCloseEvents();
    bindToggleEvents();
  });

  document.getElementById('manageLeakedBtn')?.addEventListener('click', () => {
    const data = [
      { id: 'leak_id1', password: 'pass123!' },
      { id: 'leak_id2', password: 'secret@456' },
      { id: 'leak_id3', password: 'abc#789' },
      { id: 'leak_id4', password: 'qwe@999' }
    ];
    const items = data.map(item => `
      <li class="pw-entry mb-3">
        <div class="entry-header cursor-pointer">
          <span class="id-text font-medium text-red-700">${item.id}</span>
        </div>
        <div class="entry-body hidden mt-2">
          <div class="flex items-center">
            <input type="password" class="pw-field flex-1 px-3 py-2 rounded border border-red-300" readonly value="${item.password}" />
            <button type="button" class="toggle-visibility ml-2 text-red-500">
              <i class="fa-solid fa-eye"></i>
            </button>
          </div>
        </div>
      </li>`).join('');

    openGenericModal('유출된 비밀번호', `
      <div class="bg-red-50 border-l-4 border-red-400 rounded-lg p-4">
        <ul class="pw-list space-y-2">${items}</ul>
      </div>
    `);

    bindModalCloseEvents();
    bindToggleEvents();
  });

  document.getElementById('manageExpiredBtn')?.addEventListener('click', () => {
    const data = [
      { id: 'old_id1', password: 'oldpass#1' },
      { id: 'old_id2', password: 'oldpass#2' },
      { id: 'old_id3', password: 'oldpass#3' },
      { id: 'old_id4', password: 'oldpass#4' },
      { id: 'old_id5', password: 'oldpass#5' }
    ];
    const items = data.map(item => `
      <li class="pw-entry mb-3">
        <div class="entry-header cursor-pointer">
          <span class="id-text font-medium text-yellow-700">${item.id}</span>
        </div>
        <div class="entry-body hidden mt-2">
          <div class="flex items-center">
            <input type="password" class="pw-field flex-1 px-3 py-2 rounded border border-yellow-300" readonly value="${item.password}" />
            <button type="button" class="toggle-visibility ml-2 text-yellow-500">
              <i class="fa-solid fa-eye"></i>
            </button>
          </div>
        </div>
      </li>`).join('');

    openGenericModal('오래된 비밀번호', `
      <div class="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-4">
        <ul class="pw-list space-y-2">${items}</ul>
      </div>
    `);

    bindModalCloseEvents();
    bindToggleEvents();
  });
}

export function initStatistics() {
  console.log('✅ initStatistics 실행됨');
  initStatisticsEvents();
}
