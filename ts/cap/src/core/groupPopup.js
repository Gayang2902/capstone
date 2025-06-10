import { categoryData } from './data.js';

console.log('💥 groupPopup.js 로드됨');

export function initGroupFlipPopup() {
  const overlay = document.getElementById('card-overlay');
  const popup = document.getElementById('card-popup');
  console.log('✅ initGroupPopup 실행됨');

  // 팝업 숨기기
  function hidePopup() {
    overlay.classList.add('hidden');
    popup.classList.add('hidden');
    popup.innerHTML = '';
  }

  // 카드 복제 후 간단한 2D 애니메이션 → 중앙으로 이동 & 확대
  function animateCardToModal(cardEl, onComplete) {
    const cardRect = cardEl.getBoundingClientRect();
    const clone = cardEl.cloneNode(true);
    Object.assign(clone.style, {
      position: 'fixed',
      top:    `${cardRect.top}px`,
      left:   `${cardRect.left}px`,
      width:  `${cardRect.width}px`,
      height: `${cardRect.height}px`,
      margin: '0',
      transition: 'all 0.5s ease',
      transformOrigin: 'center center',
      zIndex: '1000',
    });
    document.body.appendChild(clone);

    // 중앙 위치 계산 & 약간 확대 (scaleX=1.2)
    const targetX = window.innerWidth  / 2 - cardRect.width  / 2;
    const targetY = window.innerHeight / 2 - cardRect.height / 2;

    requestAnimationFrame(() => {
      clone.style.top       = `${targetY}px`;
      clone.style.left      = `${targetX}px`;
      clone.style.transform = 'scale(1.2)';
    });

    // 애니메이션 완료 후 클론 제거 및 팝업 실행
    setTimeout(() => {
      clone.remove();
      onComplete();
    }, 500);
  }

  // 카테고리 데이터 맵핑
  const detailsMap = Object.fromEntries(
    Object.entries(categoryData).map(([key, items]) => [
      key,
      items.map(item => ({ id: item.id, password: item.pw }))
    ])
  );

  // 카드 클릭 이벤트 바인딩
  document.querySelectorAll('.category-card').forEach(card => {
    card.addEventListener('click', () => {
      animateCardToModal(card, () => {
        const key = card.dataset.category;
        const title = card.querySelector('.font-medium').innerText;
        const details = detailsMap[key] || [];

        popup.innerHTML = `
          <div class="flip-card-main">
            <div class="flip-card-inner">
              <div class="flip-card-front flex flex-col items-center justify-center p-6">
                ${card.innerHTML}
                <p class="mt-4 text-sm text-gray-500">카드를 뒤집으려면 클릭하세요</p>
              </div>
              <div class="flip-card-back p-4">
                <div class="flex justify-between items-center mb-4">
                  <h2 class="text-lg font-semibold">${title} 목록</h2>
                  <span id="close-popup" class="cursor-pointer text-xl">&times;</span>
                </div>
                <div id="detailListContainer" class="detail-list space-y-3 overflow-y-auto max-h-[400px] pr-2">
                  ${details.map(d => `
                    <div class="pw-entry flip-card">
                      <div class="flip-card-inner">
                        <div class="flip-card-front flex items-center justify-center text-indigo-600 font-medium px-4 py-4 h-16 text-center border rounded-lg shadow">
                          ${d.id}
                        </div>
                        <div class="flip-card-back flex items-center justify-center px-4 py-4 h-16 text-center bg-gray-100 rounded-lg border">
                          <input type="password" class="pw-input text-gray-700 text-center flex-1 outline-none border-none bg-transparent" readonly value="${d.password}" />
                        </div>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>
          </div>
        `;

        // 팝업 표시
        overlay.classList.remove('hidden');
        popup.classList.remove('hidden');

        // 메인 카드 플립
        popup.querySelector('.flip-card-main .flip-card-front')
             .addEventListener('click', () => {
               popup.querySelector('.flip-card-main .flip-card-inner').classList.add('flipped');
             });

        // 닫기 버튼 활성화
        popup.querySelector('#close-popup')
             .addEventListener('click', hidePopup);

        // pw-entry 클릭 처리
        popup.querySelectorAll('.pw-entry').forEach(entryEl => {
          const flipInner = entryEl.querySelector('.flip-card-inner');
          const pwInput = entryEl.querySelector('.pw-input');

          entryEl.addEventListener('click', (e) => {
            const rect = entryEl.getBoundingClientRect();
            const clickX = e.clientX - rect.left;

            if (!flipInner.classList.contains('flipped')) {
              flipInner.classList.add('flipped');
            } else {
              if (clickX < rect.width / 2) {
                pwInput.type = pwInput.type === 'password' ? 'text' : 'password';
              } else {
                flipInner.classList.remove('flipped');
              }
            }
            e.stopPropagation();
          });
        });

        // overlay 클릭 시 닫기
        overlay.addEventListener('click', (e) => {
          if (e.target === overlay) hidePopup();
        }, { once: true });
      });
    });
  });
}
