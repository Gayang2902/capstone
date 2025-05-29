window.addEventListener('DOMContentLoaded', () => {
    const pwList      = document.getElementById('pw-list');
    const emptyMsg    = document.getElementById('empty-msg');
    const btnAdd      = document.getElementById('btn-add-entry');
    const inputSearch = document.getElementById('input-search');

    async function loadAndRenderList(query = '') {
        pwList.innerHTML = '';
        emptyMsg.textContent = '로딩 중...';
        const res = await window.electronAPI.invokeOper('getAllPwds', {});
        if (!res.status) {
            emptyMsg.textContent = '불러오기 실패: ' + res.error_message;
            return;
        }
        let data = res.data;
        if (query) {
            data = data.filter(e =>
                Object.values(e).some(val =>
                    String(val).toLowerCase().includes(query.toLowerCase())
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
        <td class="px-4 py-2">${entry.label}</td>
        <td class="px-4 py-2">${entry.type}</td>
        <td class="px-4 py-2">
          ${Object.entries(entry)
                .filter(([k]) => !['uid','label','type'].includes(k))
                .map(([k,v]) => `<strong>${k}:</strong> ${v}`)
                .join('<br/>')}
        </td>
        <td class="px-4 py-2 space-x-2">
          <button class="btn-edit px-2 py-1 bg-blue-400 text-white rounded">수정</button>
          <button class="btn-del px-2 py-1 bg-red-400  text-white rounded">삭제</button>
        </td>`;
            // 삭제
            tr.querySelector('.btn-del').addEventListener('click', async () => {
                if (!confirm('정말 삭제하시겠습니까?')) return;
                await window.electronAPI.invokeOper('deleteEntry', { uid: entry.uid });
                loadAndRenderList(inputSearch.value);
            });
            // 수정
            tr.querySelector('.btn-edit').addEventListener('click', async () => {
                const newLabel = prompt('새 레이블을 입력하세요', entry.label);
                if (newLabel === null) return;
                await window.electronAPI.invokeOper('updateEntry', { uid: entry.uid, label: newLabel });
                loadAndRenderList(inputSearch.value);
            });
            pwList.append(tr);
        });
    }

    // 검색
    inputSearch.addEventListener('input', () => {
        loadAndRenderList(inputSearch.value);
    });
    // 추가
    btnAdd.addEventListener('click', async () => {
        const label = prompt('레이블을 입력하세요');
        if (!label) return;
        const type = prompt('타입을 입력하세요 (예: website)');
        await window.electronAPI.invokeOper('createEntry', { label, type });
        loadAndRenderList(inputSearch.value);
    });
    // 초기 로드
    loadAndRenderList();
});