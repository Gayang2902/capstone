// 비밀번호 리스트 데이터 (동적 생성할 내용)
const passwordList = [
    { title: " 네이버", id: "apple123", pw: "•••••••", tag: "🌐 Web" },
    { title: " 은행", id: "user456", pw: "•••••••", tag: "🏦 Bank" },
    { title: " 메일", id: "banana789", pw: "•••••••", tag: "📧 Email" }
];

// 비밀번호 리스트를 동적으로 생성하여 테이블에 추가
function generatePasswordList() {
    const tableBody = document.getElementById('table-body');
    passwordList.forEach(item => {
        const row = document.createElement('div');
        row.classList.add('table-row');
        row.innerHTML = `
            <span>${item.title}</span>
            <span>${item.id}</span>
            <span>${item.pw}</span>
            <span>${item.tag}</span>
        `;
        tableBody.appendChild(row);
    });
}

// 페이지 로드 시 비밀번호 리스트 생성
window.onload = generatePasswordList;
