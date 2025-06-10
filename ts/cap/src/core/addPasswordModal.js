console.log('💥 addPasswordModal.js 로드됨');

export function initAddPasswordModal() {
  console.log('✅ initAddPasswordModal 시작됨');
  const modal = document.getElementById('addPasswordModal');
  if (modal) {
    // 모달 바깥(Overlay) 클릭 시 모달 닫기
    modal.addEventListener('click', (e) => {
      if (e.target === modal || e.target.id === 'addModalOverlay') {
        closeAddModal();
      }
    });
  }
}

export function bindInteriorAddButtons() {
  document.querySelectorAll('#filterAddBtnInner').forEach((btn) => {
    btn.addEventListener('click', openAddModal);
  });
}

export function openAddModal() {
  const addPasswordModal = document.getElementById('addPasswordModal');
  const addModalBox = document.getElementById('addModalBox');
  if (addPasswordModal && addModalBox) {
    // 모달 보이기
    addPasswordModal.classList.remove('opacity-0', 'pointer-events-none');
    addPasswordModal.classList.add('opacity-100');
    addModalBox.classList.remove('scale-95');
    addModalBox.classList.add('scale-100');
    showIconGrid();
  }
}

export function closeAddModal() {
  const addPasswordModal = document.getElementById('addPasswordModal');
  const addModalBox = document.getElementById('addModalBox');
  if (addPasswordModal && addModalBox) {
    // 모달 숨기기 애니메이션
    addModalBox.classList.remove('scale-100');
    addModalBox.classList.add('scale-95');
    addPasswordModal.classList.remove('opacity-100');
    addPasswordModal.classList.add('opacity-0');
    setTimeout(() => {
      addPasswordModal.classList.add('pointer-events-none');
      resetAll();
    }, 200);
  }
}

function showIconGrid() {
  const iconSelectArea = document.getElementById('iconSelectArea');
  const detailFormArea = document.getElementById('detailFormArea');
  const resetIconGridBtn = document.getElementById('resetIconGridBtn');
  if (iconSelectArea && detailFormArea && resetIconGridBtn) {
    detailFormArea.classList.add('hidden');
    detailFormArea.innerHTML = '';
    resetIconGridBtn.classList.add('hidden');
    iconSelectArea.classList.remove('hidden');
  }
}

function resetAll() {
  showIconGrid();
}
