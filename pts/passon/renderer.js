window.addEventListener('DOMContentLoaded', () => {
  // 윈도우 컨트롤 (preload.js를 통해 노출된 API 사용)
  const { minimize, maximize, close } = window.electronAPI;
  document.getElementById('min-btn').addEventListener('click', minimize);
  document.getElementById('max-btn').addEventListener('click', maximize);
  document.getElementById('close-btn').addEventListener('click', close);

  // 사이드바 네비게이션 로딩
  const navItems       = document.querySelectorAll('.sidebar nav ul.nav li');
  const main           = document.getElementById('main-content');
  const initialContent = main.innerHTML;  // Home 화면 원본 저장

  async function loadPage(page) {
    if (page === 'home') {
      main.innerHTML = initialContent;
      return;
    }

    // 해당 폴더명의 HTML, CSS 로드
    main.innerHTML = await fetch(`${page}/${page}.html`).then(r => r.text());

    const link = document.createElement('link');
    link.rel  = 'stylesheet';
    link.href = `${page}/${page}.css`;
    document.head.appendChild(link);

    // JS 파일이 있으면 동적 로드
    fetch(`${page}/${page}.js`, { method: 'HEAD' })
      .then(res => {
        if (res.ok) {
          const script = document.createElement('script');
          script.src = `${page}/${page}.js`;
          document.body.appendChild(script);
        }
      });
  }

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      navItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      loadPage(item.dataset.page);
    });
  });
});
