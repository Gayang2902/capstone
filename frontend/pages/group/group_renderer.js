// File: renderer/group_renderer.js

// 역할: 그룹 카드 클릭 시 전체 팝업 뒤집기 + API 호출해서 리스트 렌더링, 모달 클릭 시 닫기, 수정 모달 직접 구현
window.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('cardModal');
    const inner = modal.querySelector('.flip-card-inner');
    const iconEls = modal.querySelectorAll('.modal-icon');
    const titleEls = modal.querySelectorAll('.modal-title');
    const countEl = modal.querySelector('.modal-count');
    const backListContainer = modal.querySelector('.flip-card-back .px-6.py-4');
    window.currentGroupEntries = [];

    document.querySelectorAll('.group-card').forEach(card => {
        card.addEventListener('click', async () => {
            const { type, count, icon, color } = card.dataset;

            inner.classList.remove('flipped');
            iconEls.forEach(el => el.className = `${icon} ${color} text-6xl`);
            titleEls.forEach(el => el.textContent = type);
            countEl.textContent = `${count}개`;

            backListContainer.innerHTML = '<p class="text-gray-500">로딩 중...</p>';
            try {
                const res = await window.electronAPI.getPasswordsByTag(type.toLowerCase());
                window.currentGroupEntries = res.data?.data || [];
                if (!res.status) {
                    backListContainer.innerHTML = `<p class="text-red-500">불러오기 실패: ${res.error_message}</p>`;
                } else if (!currentGroupEntries.length) {
                    backListContainer.innerHTML = '<p class="text-gray-500">해당 항목이 없습니다.</p>';
                } else {
                    const grid = document.createElement('div');
                    grid.className = 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 overflow-auto max-h-[60vh]';

                    currentGroupEntries.forEach(entry => {
                        const entryDiv = document.createElement('div');
                        entryDiv.className = 'bg-white p-4 rounded-lg shadow hover:bg-indigo-50 cursor-pointer';

                        Object.entries(entry).forEach(([key, val]) => {
                            if (['UID','type','created_at','modified_at','favorite'].includes(key)) return;
                            const row = document.createElement('div');
                            row.className = 'mb-1';
                            const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                            row.innerHTML = `<strong>${label}:</strong> <span class="ml-1">${val}</span>`;
                            entryDiv.appendChild(row);
                        });

                        entryDiv.addEventListener('click', e => {
                            e.stopPropagation();
                            window.openEditModal(entry.UID);
                        });
                        grid.appendChild(entryDiv);
                    });
                    backListContainer.innerHTML = '';
                    backListContainer.appendChild(grid);
                }
            } catch (err) {
                backListContainer.innerHTML = '<p class="text-red-500">서버 호출 오류</p>';
            }

            modal.classList.remove('hidden');
            setTimeout(() => inner.classList.add('flipped'), 500);
        });
    });

    modal.addEventListener('click', e => {
        if (e.target === modal) {
            inner.classList.remove('flipped');
            modal.classList.add('hidden');
        }
    });
});

// 수정 모달 열기 함수 (그룹 페이지에 직접 구현)
async function openEditModal(uid) {
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
    editModal.addEventListener('click', e => {
        if (e.target === editModal) editModal.classList.add('hidden');
    }, { once: true });

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
        if (inputType === 'textarea') {
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
