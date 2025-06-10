// script.js

console.log('✅ script.js 시작됨');

import { initNavigation } from './core/navigation.js';
import { openGenericModal, closeGenericModal } from './core/modal.js';
import { initAddPasswordModal, bindInteriorAddButtons } from './core/addPasswordModal.js';
import { initPasswordGenerator } from './core/passwordGenerator.js';
import { initGroupFlipPopup } from './core/groupPopup.js';
import { bindDbToggle, bindViewPwdToggle, initSetting } from './core/setting.js';
import { initStatistics } from './core/statistics.js';

window.addEventListener('DOMContentLoaded', () => {
  // 모달 오버레이/뒤로가기 등 초기화
  initAddPasswordModal();
  // 비밀번호 생성기 초기화
  initPasswordGenerator();
  // 그룹 플립 팝업 초기화
  initGroupFlipPopup();
  // 통계 페이지 초기화
  initStatistics();
  // 설정 페이지 토글 초기화
  initSetting();
  // 네비게이션 초기화 (여기서 Home 컨텐츠 로드됨)
  initNavigation();
  // '+' 버튼에 모달 오픈 바인딩 (Home 로드 후)
  bindInteriorAddButtons();
});

function bindHelpButton() {
  const helpBtn = document.getElementById('btnHelp');
  if (!helpBtn) return;
  helpBtn.addEventListener('click', () => {
    // 2페이지로 나눈 도움말 내용 (중요 키워드는 빨간색)
    const pages = [
      `<div class="p-4 space-y-4 h-full">
         <p>이 앱은 안전하게 비밀번호를 관리하기 위한 
            <span class="text-red-500 font-semibold">Password Master</span>입니다.</p>
         <ul class="list-disc list-inside space-y-2">
           <li><span class="text-red-500 font-semibold">Home</span>: 저장된 비밀번호를 보고, 새 비밀번호를 추가할 수 있습니다.</li>
           <li><span class="text-red-500 font-semibold">Statistics</span>: 전체 비밀번호 통계를 확인하고, 취약·중복·오래된 항목을 관리합니다.</li>
           <li><span class="text-red-500 font-semibold">Group</span>: 카테고리별(웹, 서버, 카드 등)로 비밀번호를 묶어서 확인합니다.</li>
         </ul>
       </div>`,
      `<div class="p-4 space-y-4 h-full">
         <ul class="list-disc list-inside space-y-2">
           <li><span class="text-red-500 font-semibold">Setting</span>: 마스터 비밀번호 변경, DB 경로 설정, 자동 잠금 등을 조절합니다.</li>
           <li><span class="text-red-500 font-semibold">Password Generator</span>: 안전한 비밀번호를 간편히 생성합니다.</li>
         </ul>
         <p class="text-sm text-gray-500">
           언제든지 <span class="text-red-500">'도움말(?)'</span> 버튼을 클릭해 이 안내를 확인하세요.
         </p>
       </div>`
    ];

    // 책 넘김 CSS + HTML
    const flipbookHtml = `
      <style>
        .flipbook { perspective: 1500px; height: 300px; position: relative; }
        .flipbook .page {
          width: 100%; height: 100%; background: #fff;
          position: absolute; top: 0; left: 0;
          backface-visibility: hidden;
          transform-origin: left center;
          transition: transform 0.6s ease;
          border-radius: 0.5rem;
        }
        .flipbook .page:nth-child(1) { z-index: 2; }
        .flipbook.flipped .page:nth-child(1) { transform: rotateY(-180deg); }
        .flipbook .page:nth-child(2) { transform: rotateY(180deg); }
        .flipbook.flipped .page:nth-child(2) { transform: rotateY(0deg); }
      </style>
      <div id="helpFlipbook" class="flipbook">
        <div class="page">${pages[0]}</div>
        <div class="page">${pages[1]}</div>
        <button id="helpPrev"
                class="absolute left-2 top-1/2 transform -translate-y-1/2
                       bg-white rounded-full shadow p-2 text-2xl">❮</button>
        <button id="helpNext"
                class="absolute right-2 top-1/2 transform -translate-y-1/2
                       bg-white rounded-full shadow p-2 text-2xl">❯</button>
      </div>
    `;

    // 모달 열기
    openGenericModal('도움말 – Password Master', flipbookHtml);

    // X 버튼·배경 클릭 닫기 바인딩
    document.getElementById('modalCloseBtn')?.addEventListener('click', closeGenericModal);
    document.getElementById('genericModal')?.addEventListener('click', e => {
      if (e.target.id === 'genericModal') closeGenericModal();
    });

    // 페이지 넘기기 이벤트
    const flipbook = document.getElementById('helpFlipbook');
    document.getElementById('helpNext').addEventListener('click', () => {
      flipbook.classList.add('flipped');
    });
    document.getElementById('helpPrev').addEventListener('click', () => {
      flipbook.classList.remove('flipped');
    });
  });
}

window.addEventListener('DOMContentLoaded', () => {
  initAddPasswordModal();
  initPasswordGenerator();
  initGroupFlipPopup();
  initStatistics();
  initSetting();
  initNavigation();
  bindInteriorAddButtons();
  bindHelpButton();
});
