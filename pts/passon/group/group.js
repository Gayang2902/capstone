const tbody = document.querySelector('tbody');

// 그룹 삭제 로직
function deleteGroup() {
  const name = prompt('삭제할 그룹 이름을 입력하세요:');
  if (!name) return;
  const rows = Array.from(tbody.querySelectorAll('tr'));
  const target = rows.find(tr => tr.children[0].textContent === name);
  if (target) {
    target.remove();
    alert(`"${name}" 그룹이 삭제되었습니다.`);
  } else {
    alert(`"${name}" 그룹을 찾을 수 없습니다.`);
  }
}

// 그룹 추가 로직
function addGroup() {
  const name = prompt('새 그룹 이름을 입력하세요:');
  if (!name) return;
  const tr = document.createElement('tr');
  tr.innerHTML = `<td>${name}</td><td>0</td>`;
  tbody.appendChild(tr);
}

// 이벤트 바인딩
document.querySelector('.plus').addEventListener('click', addGroup);
document.querySelector('.delete-group').addEventListener('click', deleteGroup);
