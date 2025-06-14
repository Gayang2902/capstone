// File: renderer/group_renderer.js


// 역할: 그룹 카드 클릭 시 전체 팝업 뒤집기 + API 호출해서 리스트 렌더링, 모달 클릭 시 닫기, 수정 모달 직접 구현
window.addEventListener('DOMContentLoaded', () => {
    // 타입별 필드 및 라벨 설정 (home_renderer.js와 동일)
    const fieldConfig = {
      wifi: [
        { key: 'name', label: '이름' },
        { key: 'pwd',  label: '비밀번호' },
        { key: 'comments', label: '설명' }
      ],
      server: [
        { key: 'id',   label: '아이디' },
        { key: 'pwd',  label: '비밀번호' },
        { key: 'host', label: '호스트' },
        { key: 'port', label: '포트' },
        { key: 'comments', label: '설명' }
      ],
      bankbook: [
        { key: 'bank_name', label: '은행 이름' },
        { key: 'num',       label: '계좌번호' },
        { key: 'master',    label: '예금주' },
        { key: 'pwd',       label: '계좌 비밀번호' },
        { key: 'comments',  label: '설명' }
      ],
      identity: [
        { key: 'name',       label: '이름' },
        { key: 'eng_name',   label: '영문이름' },
        { key: 'address',    label: '주소' },
        { key: 'birth_date', label: '생일' },
        { key: 'citizen',    label: '주민번호' },
        { key: 'comments',   label: '설명' }
      ],
      security: [
        { key: 'content',   label: '내용' },
        { key: 'comments',  label: '설명' }
      ],
      website: [
        { key: 'url',       label: 'URL' },
        { key: 'id',        label: '아이디' },
        { key: 'pwd',       label: '비밀번호' },
        { key: 'email',     label: '이메일' },
        { key: 'comments',  label: '설명' }
      ],
      card: [
        { key: 'bank_name',   label: '은행이름' },
        { key: 'name',        label: '예금주' },
        { key: 'card_number', label: '카드 번호' },
        { key: 'cvc',         label: 'CVC' },
        { key: 'last_day',    label: '만료일' },
        { key: 'comments',    label: '설명' }
      ]
    };

    const typeIconClasses = {
      wifi:     'fa-solid fa-wifi text-indigo-500',
      website:  'fa-solid fa-globe text-blue-600',
      server:   'fa-solid fa-server text-blue-500',
      bankbook: 'fa-solid fa-book text-yellow-500',
      identity: 'fa-solid fa-id-card text-pink-500',
      security: 'fa-solid fa-shield-alt text-green-500',
      card:     'fa-solid fa-credit-card text-teal-500'
    };

    function createEntryCard(entry) {
      const card = document.createElement('div');
      card.className = 'flex flex-col space-y-3 p-4 bg-white rounded-xl border border-gray-200 shadow-md w-full mb-4 cursor-pointer';
      card.dataset.uid = entry.UID;
      card.dataset.type = entry.type;

      // Create header: icon + title + favorite icon
      const header = document.createElement('div');
      header.className = 'flex justify-between items-center mb-2 border-b border-gray-200 pb-2';

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
      title.textContent = entry.label || '(No Label)';
      leftDiv.appendChild(title);

      // 최근 사용일 표시
      const modSpan = document.createElement('span');
      modSpan.className = 'text-sm text-gray-500 ml-4';
      modSpan.textContent = `최근 수정일: ${entry.modified_at}`;
      leftDiv.appendChild(modSpan);

      header.appendChild(leftDiv);

      const favIcon = document.createElement('i');
      favIcon.className = entry.favorite
        ? 'fa-solid fa-star text-yellow-500'
        : 'fa-regular fa-star text-gray-400';
      favIcon.style.cursor = 'pointer';
      favIcon.title = '즐겨찾기 토글';
      favIcon.addEventListener('click', async (e) => {
        e.stopPropagation();
        try {
          const newFav = !entry.favorite;
          const res = await window.electronAPI.updatePasswordEntry({ UID: entry.UID, favorite: newFav.toString() });
          if (res.status) {
            entry.favorite = newFav;
            favIcon.className = newFav ? 'fa-solid fa-star text-yellow-500' : 'fa-regular fa-star text-gray-400';
            // Move this card within the current list so favorites stay on top
            const cardEl = favIcon.closest('[data-uid]');
            const container = cardEl.parentElement;
            if (entry.favorite) {
              container.prepend(cardEl);
            } else {
              container.appendChild(cardEl);
            }
          } else {
            window.showToast('즐겨찾기 변경 실패: ' + res.error_message, 'error');
          }
        } catch (err) {
          window.showToast('즐겨찾기 변경 오류', 'error');
        }
      });

      // Favorite icon (existing setup)
      header.appendChild(favIcon);

      card.appendChild(header);

      // 2) Field list by type using common fieldConfig
      const config = fieldConfig[entry.type] || [];
      config.forEach(({ key, label }) => {
        const value = entry[key];
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
          window.electronAPI.getPasswordDetail({ UID: entry.UID })
            .then(res => {
              if (res.status && res.data.pwd) {
                revealed = res.data.pwd;
                valEl.textContent = '*'.repeat(revealed.length);
              }
            })
            .catch(() => {});
          valEl.addEventListener('mouseenter', () => {
            if (revealed) valEl.textContent = revealed;
          });
          valEl.addEventListener('mouseleave', () => {
            valEl.textContent = revealed ? '*'.repeat(revealed.length) : '••••••';
          });
          valEl.addEventListener('click', async e => {
            e.stopPropagation();
            const text = revealed || (await window.electronAPI.getPasswordDetail({ UID: entry.UID })).data.pwd;
            await navigator.clipboard.writeText(text);
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

      // Click event to open edit modal
      card.addEventListener('click', () => {
        window.openEditModal(entry.UID);
      });

      return card;
    }

    const modal = document.getElementById('cardModal');
    const inner = modal.querySelector('.flip-card-inner');
    const iconEls = modal.querySelectorAll('.modal-icon');
    const titleEls = modal.querySelectorAll('.modal-title');
    const countEl = modal.querySelector('.modal-count');
    const backListContainer = modal.querySelector('.flip-card-back');
    // Allow full-width cards and scrolling inside the modal back side
    backListContainer.classList.add(
      'px-6',
      'py-4',
      'overflow-y-auto',
      'max-h-[80vh]'
    );
    // Ensure backListContainer lays out cards in a column
    backListContainer.classList.remove('flex', 'flex-col', 'space-y-4');
    window.currentGroupEntries = [];

    document.querySelectorAll('.group-card').forEach(card => {
        card.addEventListener('click', async () => {
            // Shared-element transition: expand clicked card into modal
            const cardRect = card.getBoundingClientRect();
            const modal = document.getElementById('cardModal');
            const modalInner = modal.querySelector('.flip-card-inner');
            const modalFront = modalInner.querySelector('.flip-card-front');
            // Temporarily show modal front hidden for measurement
            modal.classList.remove('hidden');
            const prevVisibility = modal.style.visibility;
            modal.style.visibility = 'hidden';
            modalInner.classList.remove('flipped');
            const modalRect = modalFront.getBoundingClientRect();
            // Restore modal hidden state
            modal.style.visibility = prevVisibility || '';
            modal.classList.add('hidden');

            // Shared-element transition: animate clone via transform
            const cardClone = card.cloneNode(true);
            const originX = cardRect.left;
            const originY = cardRect.top;
            Object.assign(cardClone.style, {
              position: 'fixed',
              top: '0px',
              left: '0px',
              width: `${cardRect.width}px`,
              height: `${cardRect.height}px`,
              margin: '0',
              zIndex: '10000',
              transformOrigin: 'top left',
              transform: `translate(${originX}px, ${originY}px) scale(1,1)`,
              transition: 'transform 300ms ease'
            });
            document.body.appendChild(cardClone);

            // Calculate translation and scaling relative to viewport
            const deltaX = modalRect.left - cardRect.left;
            const deltaY = modalRect.top  - cardRect.top;
            const scaleX = modalRect.width / cardRect.width;
            const scaleY = modalRect.height / cardRect.height;

            // Trigger animation
            requestAnimationFrame(() => {
              cardClone.style.transform = `translate(${originX + deltaX}px, ${originY + deltaY}px) scale(${scaleX}, ${scaleY})`;
            });

            // After animation, fade out clone and show modal content
            cardClone.addEventListener('transitionend', async () => {
              // Populate modal content behind the clone
              const { type, icon, color } = card.dataset;
              inner.classList.remove('flipped');
              // iconEls.forEach(el => el.className = `${icon} ${color} text-6xl`);
              // titleEls.forEach(el => el.textContent = type);
              backListContainer.innerHTML = '<p class="text-gray-500">로딩 중...</p>';
              try {
                const res = await window.electronAPI.getPasswordsByTag(type.toLowerCase());
                if (!res.status) {
                  backListContainer.innerHTML = `<p class="text-red-500">불러오기 실패: ${res.error_message}</p>`;
                } else {
                  let entries = Array.isArray(res.data?.data) ? res.data.data : [];
                  entries.sort((a,b)=>(b.favorite?1:0)-(a.favorite?1:0));
                  // countEl.textContent = `${entries.length}개`;
                  if (!entries.length) {
                    backListContainer.innerHTML = '<p class="text-gray-500">해당 항목이 없습니다.</p>';
                  } else {
                    backListContainer.innerHTML = '';
                    entries.forEach(entry => {
                      const cardEl = createEntryCard(entry);
                      backListContainer.appendChild(cardEl);
                    });
                  }
                }
              } catch (err) {
                console.error('getPasswordsByTag 오류:', err);
                backListContainer.innerHTML = '<p class="text-red-500">서버 호출 오류</p>';
              }

              // Show modal
              modal.classList.remove('hidden');
              setTimeout(() => inner.classList.add('flipped'), 50);

              // Fade out clone to smoothly transition to modal
              cardClone.style.transition = 'opacity 200ms ease';
              cardClone.style.opacity = '0';
              cardClone.addEventListener('transitionend', () => {
                if (cardClone.parentElement) {
                  cardClone.parentElement.removeChild(cardClone);
                }
              });

              // Register reverse transition on background click
              const closeHandler = () => {
                // Shared-element close: reverse the open animation
                const closeClone = card.cloneNode(true);
                Object.assign(closeClone.style, {
                  position: 'fixed',
                  top: '0px',
                  left: '0px',
                  width: `${cardRect.width}px`,
                  height: `${cardRect.height}px`,
                  transformOrigin: 'top left',
                  transform: `translate(${modalRect.left}px, ${modalRect.top}px) scale(${modalRect.width / cardRect.width}, ${modalRect.height / cardRect.height})`,
                  transition: 'transform 300ms ease'
                });
                document.body.appendChild(closeClone);

                // Hide modal immediately
                modalInner.classList.remove('flipped');
                setTimeout(() => modal.classList.add('hidden'), 0);

                // Animate clone back to original card position/size
                requestAnimationFrame(() => {
                  closeClone.style.transform = `translate(${cardRect.left}px, ${cardRect.top}px) scale(1)`;
                });
                // Remove clone after animation
                closeClone.addEventListener('transitionend', () => {
                  closeClone.remove();
                });

                // Clean up listener
                modal.removeEventListener('click', closeHandler);
              };
              modal.addEventListener('click', function modalBgHandler(e) {
                if (e.target !== modal) return;
                closeHandler();
                modal.removeEventListener('click', modalBgHandler);
              });
            });
        });
    });

    // 태그별 카드의 count-span을 실제 개수로 갱신
    document.querySelectorAll('.group-card').forEach(async card => {
      const tag = card.dataset.type;  // wifi, server, bankbook, …
      try {
        const res = await window.electronAPI.getPasswordsByTag(tag);
        const count = (res.status && Array.isArray(res.data?.data))
          ? res.data.data.length
          : 0;
        const span = card.querySelector('.count-span');
        if (span) span.textContent = `${count}개`;
      } catch (e) {
        console.error('getPasswordsByTag 오류 (count):', e);
      }
    });

});

// 수정 모달 열기 함수 (그룹 페이지에 직접 구현)
window.openEditModal = async function(uid) {
    const entry = window.currentGroupEntries.find(e => e.UID === uid);
    if (!entry) return;

    const editModal = document.getElementById('editModal');
    if (!editModal) {
        console.error('Edit modal element not found');
        return;
    }
    const editForm = document.getElementById('editForm');
    const saveEdit = document.getElementById('saveEdit');
    const cancelEdit = document.getElementById('cancelEdit');

    editModal.classList.remove('hidden');
    editModal.classList.add('flex');
    // Define the closeOnBackground function before using it
    function closeOnBackground(e) {
        if (e.target === editModal) editModal.classList.add('hidden');
    }
    // Remove any previous listener to avoid duplicates
    editModal.removeEventListener('click', closeOnBackground);
    editModal.addEventListener('click', closeOnBackground);

    editForm.innerHTML = '';
    // Label + Favorite
    const favDiv = document.createElement('div');
    favDiv.className = 'mb-4 flex items-center space-x-2';
    favDiv.innerHTML = `
        <input id="edit-label" type="text" value="${entry.label||''}" class="flex-1 border rounded px-2 py-1" />
        <i id="edit-fav-icon" class="fa-star ${entry.favorite?'fa-solid text-yellow-500':'fa-regular text-gray-400'} cursor-pointer text-xl"></i>
    `;
    editForm.appendChild(favDiv);
    const favIcon = favDiv.querySelector('#edit-fav-icon');
    favIcon.addEventListener('click', () => {
        entry.favorite = !entry.favorite;
        favIcon.classList.toggle('fa-solid', entry.favorite);
        favIcon.classList.toggle('fa-regular', !entry.favorite);
        favIcon.classList.toggle('text-yellow-500', entry.favorite);
        favIcon.classList.toggle('text-gray-400', !entry.favorite);
    });

    // 타입별 필드 설정
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
        const div = document.createElement('div'); div.className = 'mb-4';
        if (inputType === 'password') {
            div.innerHTML = `
                <label class="block text-sm font-medium">${label}</label>
                <div class="relative">
                  <input id="edit-${key}" type="password"
                         class="mt-1 w-full border rounded px-2 py-1 pr-10" />
                  <button id="toggle-${key}" type="button"
                          class="absolute inset-y-0 right-2 flex items-center">
                    <i class="fa-solid fa-eye-slash text-gray-500"></i>
                  </button>
                </div>
            `;
            // Fetch real password from backend and set as value
            window.electronAPI.getPasswordDetail({ UID: uid })
              .then(res => {
                if (res.status) {
                  div.querySelector(`#edit-${key}`).value = res.data.pwd;
                } else {
                  window.showToast('비밀번호 불러오기 실패', 'error');
                }
              })
              .catch(() => window.showToast('비밀번호 불러오기 오류', 'error'));
            // Toggle visibility on eye icon click
            const toggleBtn = div.querySelector(`#toggle-${key}`);
            const pwdInput = div.querySelector(`#edit-${key}`);
            const iconEl = toggleBtn.querySelector('i');
            toggleBtn.addEventListener('click', () => {
              if (pwdInput.type === 'password') {
                pwdInput.type = 'text';
                iconEl.classList.remove('fa-eye-slash');
                iconEl.classList.add('fa-eye');
              } else {
                pwdInput.type = 'password';
                iconEl.classList.remove('fa-eye');
                iconEl.classList.add('fa-eye-slash');
              }
            });
        } else if (inputType === 'textarea') {
            div.innerHTML = `
                <label class="block text-sm font-medium">${label}</label>
                <textarea id="edit-${key}" class="mt-1 w-full border rounded px-2 py-1">${entry[key]||''}</textarea>
            `;
        } else {
            div.innerHTML = `
                <label class="block text-sm font-medium">${label}</label>
                <input id="edit-${key}" type="${inputType}" value="${entry[key]||''}" class="mt-1 w-full border rounded px-2 py-1" />
            `;
        }
        editForm.appendChild(div);
    });

    // Comments
    const commentsDiv = document.createElement('div'); commentsDiv.className = 'mb-4';
    commentsDiv.innerHTML = `
        <label class="block text-sm font-medium">Comments</label>
        <textarea id="edit-comments" class="mt-1 w-full border rounded px-2 py-1">${entry.comments||''}</textarea>
    `;
    editForm.appendChild(commentsDiv);

    // 저장 & 취소 이벤트
    saveEdit.onclick = async () => {
        const updated = { UID: uid, label: document.getElementById('edit-label').value.trim(), comments: document.getElementById('edit-comments').value.trim(), favorite: entry.favorite.toString() };
        (typeFields[entry.type]||[]).forEach(([_,key]) => updated[key] = document.getElementById(`edit-${key}`).value);
        try {
            const res = await window.electronAPI.updatePasswordEntry(updated);
            if (!res.status) throw new Error(res.error_message);
            editModal.classList.add('hidden'); location.reload();
        } catch (e) {
            window.showToast('수정 실패: ' + e.message, 'error');
        }
    };
    cancelEdit.onclick = () => editModal.classList.add('hidden');
}
