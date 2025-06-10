export function bindDbToggle() {
  console.log('✅ bindDbToggle 실행됨');
  const dbPathInput = document.getElementById('dbPathInput');
  const toggleDbMaskBtn = document.getElementById('toggleDbMaskBtn');
  const dbMaskIcon = document.getElementById('dbMaskIcon');
  if (!dbPathInput || !toggleDbMaskBtn || !dbMaskIcon) return;
  let dbMasked = true;
  toggleDbMaskBtn.addEventListener('click', () => {
    dbMasked = !dbMasked;
    if (dbMasked) {
      dbPathInput.setAttribute('type', 'password');
      dbMaskIcon.classList.remove('fa-eye');
      dbMaskIcon.classList.add('fa-eye-slash');
    } else {
      dbPathInput.setAttribute('type', 'text');
      dbMaskIcon.classList.remove('fa-eye-slash');
      dbMaskIcon.classList.add('fa-eye');
    }
  });
}

export function bindViewPwdToggle() {
  console.log('✅ bindViewPwdToggle 실행됨');
  const viewPwdInput = document.getElementById('viewPwdInput');
  const toggleViewPwdBtn = document.getElementById('toggleViewPwdBtn');
  const viewPwdIcon = document.getElementById('viewPwdIcon');
  if (!viewPwdInput || !toggleViewPwdBtn || !viewPwdIcon) return;
  let viewPwdMasked = true;
  toggleViewPwdBtn.addEventListener('click', () => {
    viewPwdMasked = !viewPwdMasked;
    if (viewPwdMasked) {
      viewPwdInput.setAttribute('type', 'password');
      viewPwdIcon.classList.remove('fa-eye');
      viewPwdIcon.classList.add('fa-eye-slash');
    } else {
      viewPwdInput.setAttribute('type', 'text');
      viewPwdIcon.classList.remove('fa-eye-slash');
      viewPwdIcon.classList.add('fa-eye');
    }
  });
}

export function initSetting() {
  console.log('✅ initSetting 실행됨');
  bindDbToggle();
  bindViewPwdToggle();
}
