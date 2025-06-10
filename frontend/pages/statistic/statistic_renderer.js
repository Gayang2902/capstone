// File: src/statistics/statistic_renderer.js

window.addEventListener('DOMContentLoaded', async () => {
  // 카드 요소
  const totalCountEl   = document.getElementById('totalCount');
  const weakCountEl    = document.getElementById('weakCount');
  const secureCountEl  = document.getElementById('secureCount');
  const normalCountEl  = document.getElementById('dupCount');

  // 차트 컨텍스트
  const ctxBar = document.getElementById('accountChart')?.getContext('2d');
  const ctxPie = document.getElementById('strengthChart')?.getContext('2d');

  try {
    // API 호출
    const totalRes  = await window.electronAPI.getPasswordCount();
    const strongRes = await window.electronAPI.getStrongCount();
    const normalRes = await window.electronAPI.getNormalCount();
    const weakRes   = await window.electronAPI.getWeakCount();

    // 상태 체크
    if (!totalRes.status || !strongRes.status || !normalRes.status || !weakRes.status) {
      throw new Error('API 오류');
    }

    const total  = totalRes.data.total;
    const strong = strongRes.data.total;
    const normal = normalRes.data.total;
    const weak   = weakRes.data.total;

    // 카드 업데이트
    totalCountEl.textContent  = `${total}개`;
    secureCountEl.textContent = `${strong}개`;
    normalCountEl.textContent = `${normal}개`;
    weakCountEl.textContent   = `${weak}개`;

    // Doughnut 차트: 강력, 보통, 취약
    if (ctxPie) {
      new Chart(ctxPie, {
        type: 'doughnut',
        data: {
          labels: ['강력', '보통', '취약'],
          datasets: [{
            data: [strong, normal, weak],
            backgroundColor: [
              'rgba(72,187,120,0.8)',
              'rgba(245,158,11,0.8)',
              'rgba(239,68,68,0.8)'
            ],
            borderColor: [
              'rgba(72,187,120,1)',
              'rgba(245,158,11,1)',
              'rgba(239,68,68,1)'
            ],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '60%',
          plugins: {
            legend: { position: 'right' },
            title: { display: true, text: '강도별 분포' }
          }
        }
      });
    }

    // Bar 차트: 강력, 보통, 취약
    if (ctxBar) {
      new Chart(ctxBar, {
        type: 'bar',
        data: {
          labels: ['강력', '보통', '취약'],
          datasets: [{
            label: '비밀번호 개수',
            data: [strong, normal, weak],
            backgroundColor: [
              'rgba(72,187,120,0.8)',
              'rgba(245,158,11,0.8)',
              'rgba(239,68,68,0.8)'
            ],
            borderColor: [
              'rgba(72,187,120,1)',
              'rgba(245,158,11,1)',
              'rgba(239,68,68,1)'
            ],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: { beginAtZero: true }
          },
          plugins: {
            title: { display: true, text: '강도별 비밀번호 개수' },
            legend: { display: false }
          }
        }
      });
    }
  } catch (err) {
    console.error('통계 로드 오류:', err);
    totalCountEl.textContent  = 'API 오류';
    secureCountEl.textContent = 'API 오류';
    normalCountEl.textContent = 'API 오류';
    weakCountEl.textContent   = 'API 오류';
  }
});