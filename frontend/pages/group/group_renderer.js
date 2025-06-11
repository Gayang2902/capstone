// renderer/group_renderer.js
// 역할: 그룹 카드 클릭 시 전체 팝업 뒤집기, 모달 클릭 시 닫기
window.addEventListener('DOMContentLoaded', () => {
    const modal      = document.getElementById('cardModal');
    const inner      = modal.querySelector('.flip-card-inner');
    const iconEls    = modal.querySelectorAll('.modal-icon');
    const titleEls   = modal.querySelectorAll('.modal-title');
    const countEl    = modal.querySelector('.modal-count');
    const idEl       = modal.querySelector('.back-id');
    const pwEl       = modal.querySelector('.back-password');

    document.querySelectorAll('.group-card').forEach(card => {
        card.addEventListener('click', () => {
            const { type, count, icon, color, id, password } = card.dataset;

            // 초기화: 앞면으로
            inner.classList.remove('flipped');

            // 앞/뒷면 아이콘 & 제목
            iconEls.forEach(el => el.className = `${icon} ${color} text-6xl`);
            titleEls.forEach(el => el.textContent = type);

            // 앞면 개수 표시
            if (countEl) countEl.textContent = `${count}개`;

            // 뒷면 ID/PW
            idEl.textContent = id;
            pwEl.textContent = password;

            // 모달 보이기
            modal.classList.remove('hidden');

            // 2초 후 부드럽게 뒤집기
            setTimeout(() => inner.classList.add('flipped'), 2000);
        });
    });

    // 배경 클릭 시 닫기
    modal.addEventListener('click', e => {
        if (e.target === modal) {
            inner.classList.remove('flipped');
            modal.classList.add('hidden');
        }
    });
});
