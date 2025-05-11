(() => {
  const canvas = document.getElementById('riskChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // 그라데이션 생성 헬퍼
  function makeGradient(c1, c2) {
    const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
    g.addColorStop(0, c1);
    g.addColorStop(1, c2);
    return g;
  }

  // 샘플 데이터 — 실제 데이터로 교체
  const data = [20, 15, 10, 5];
  const gradients = [
    makeGradient('rgba(138,109,244,0.8)', 'rgba(72,42,181,0.8)'),
    makeGradient('rgba(244,109,138,0.8)', 'rgba(181,42,72,0.8)'),
    makeGradient('rgba(109,244,138,0.8)', 'rgba(42,181,72,0.8)'),
    makeGradient('rgba(244,244,109,0.8)', 'rgba(181,181,42,0.8)')
  ];

  // 차트 생성
  window.riskChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['중복됨', '오래됨', '약함', '기타'],
      datasets: [{
        data: data,
        backgroundColor: gradients,
        borderColor: '#1e1e2f',
        borderWidth: 3
      }]
    },
    options: {
      cutout: '60%',
      rotation: -90,
      circumference: 180,
      animation: { animateRotate: true, duration: 1200 },
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: '#ececec', font: { size: 12 } }
        },
        tooltip: {
          backgroundColor: 'rgba(0,0,0,0.7)',
          titleColor: '#fff',
          bodyColor: '#fff',
          borderColor: '#888',
          borderWidth: 1
        }
      }
    }
  });
})();
