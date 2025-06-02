// // ────────────────────────────────────────────────────────────────────────────────
// // src/group/group-init.js
// // 역할: 그룹 페이지 내 태그 버튼 클릭 시 해당 태그 콘텐츠를 렌더링하고,
// //      초기 로드 시 첫 번째 태그를 자동으로 선택합니다.
// // ────────────────────────────────────────────────────────────────────────────────
//
// // ─── 1) 태그 버튼 초기화 및 클릭 이벤트 바인딩 시작 ───
// // 태그 버튼 엘리먼트를 모두 가져와서 배열 형태로 저장
// const tagButtons = document.querySelectorAll('#tagContainer .tag-btn');
// // 실제 콘텐츠가 그려질 컨테이너 엘리먼트
// const groupContent = document.getElementById('groupContent');
//
// tagButtons.forEach(btn => {
//     // 각 버튼에 클릭 이벤트 리스너를 추가
//     btn.addEventListener('click', () => {
//         // 클릭된 버튼의 data-tag 속성값(태그명)을 가져옴
//         const tag = btn.dataset.tag;
//
//         // ─── 1-1) 선택된 버튼만 하이라이트 ───
//         // 모든 버튼에서 하이라이트 관련 클래스 제거
//         tagButtons.forEach(b =>
//             b.classList.remove('bg-blue-100', 'text-blue-800', 'border-blue-300')
//         );
//         // 클릭된 버튼에만 하이라이트 스타일 추가
//         btn.classList.add('bg-blue-100', 'text-blue-800', 'border-blue-300');
//
//         // ─── 1-2) groupContent 초기화 및 태그별 콘텐츠 렌더링 ───
//         // 기존에 그려진 콘텐츠 모두 삭제
//         groupContent.innerHTML = '';
//
//         // 예시: 더미 항목 배열 생성 (실제 연동 시 API/IPC 호출 결과로 대체)
//         const dummyItems = [
//             `${tag} 항목 A`,
//             `${tag} 항목 B`,
//             `${tag} 항목 C`
//         ];
//
//         // 더미 항목마다 카드 엘리먼트를 생성하여 화면에 추가
//         dummyItems.forEach(text => {
//             // 카드 컨테이너 생성 및 클래스 지정
//             const card = document.createElement('div');
//             card.className = 'bg-white p-4 rounded-lg shadow';
//             // 카드 내부 텍스트 설정
//             card.textContent = text;
//             // 화면에 append
//             groupContent.append(card);
//         });
//         // ─── 1-2) 렌더링 완료 ───
//     });
// });
// // ─── 태그 버튼 이벤트 바인딩 끝 ───
//
//
// // ─── 2) 초기 로드 시 첫 번째 태그 자동 선택 시작 ───
// // DOMContentLoaded 이벤트: HTML 파싱이 완료되면 실행
// window.addEventListener('DOMContentLoaded', () => {
//     if (tagButtons.length > 0) {
//         // 버튼이 하나라도 있으면 첫 번째 버튼을 클릭하여 초기 콘텐츠 표시
//         tagButtons[0].click();
//     }
// });
// // ─── 초기 로드 자동 선택 끝 ───
