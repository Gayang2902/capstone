// ────────────────────────────────────────────────────────────────────────────────
// src/statistics/chart-init.js
// 역할: Chart.js를 사용해 바 차트와 도넛 차트를 초기화하고,
//      API로부터 통계 데이터를 가져와 차트와 카드 정보를 업데이트합니다.
// ────────────────────────────────────────────────────────────────────────────────

(async function() {
  // ─── ① Canvas context 가져오기 ───
  // 바 차트용 <canvas id="barChart"> 엘리먼트의 2D 컨텍스트
  const ctxBar = document.getElementById('barChart').getContext('2d');
  // 도넛 차트용 <canvas id="pieChart"> 엘리먼트의 2D 컨텍스트
  const ctxPie = document.getElementById('pieChart').getContext('2d');

  // ─── ② 빈 차트 생성 (로딩 프레임 표시) ───
  const barChart = new Chart(ctxBar, {
    type: 'bar',
    data: {
      labels: [],              // 초기 레이블 없음
      datasets: [{
        label: '계정 수',         // 차트 제목 또는 범례 라벨
        data: [],               // 초기 데이터 없음
        backgroundColor: 'rgba(54,162,235,0.5)', // 막대 내부 색
        borderColor: 'rgba(54,162,235,1)',       // 막대 테두리 색
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 1.5,        // 너비 대비 높이 비율
      scales: {
        y: { beginAtZero: true } // Y축 0부터 시작
      },
      plugins: {
        legend: { display: true }, // 범례 표시
        beforeDraw: chart => {
          // 데이터가 없을 때 중앙에 '데이터 로딩 중...' 표시
          if (chart.data.labels.length === 0) {
            const { ctx, chartArea: { left, right, top, bottom } } = chart;
            ctx.save();
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#888';
            ctx.font = '16px sans-serif';
            ctx.fillText(
              '데이터 로딩 중...',
              (left + right) / 2,
              (top + bottom) / 2
            );
            ctx.restore();
          }
        }
      }
    }
  });

  const pieChart = new Chart(ctxPie, {
    type: 'doughnut',
    data: {
      labels: ['강력', '보통', '취약'], // 도넛 섹션 레이블
      datasets: [{
        data: [0, 0, 0],            // 초기 데이터 모두 0
        backgroundColor: [         // 섹션별 색상
          'rgba(30,144,255,0.8)',
          'rgba(255,99,132,0.8)',
          'rgba(255,165,0,0.8)'
        ]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 1.2,           // 도넛 차트 비율
      cutout: '60%',             // 중앙 빈 공간 비율
      plugins: {
        legend: { position: 'right' }, // 범례 우측 배치
        beforeDraw: chart => {
          const ds = chart.data.datasets[0].data;
          // 모든 값이 0일 때 회색 프레임과 로딩 텍스트 표시
          if (ds.every(v => v === 0)) {
            const { ctx } = chart;
            const meta = chart.getDatasetMeta(0).data[0];
            const x = meta.x, y = meta.y;
            const outer = meta.outerRadius, inner = meta.innerRadius;

            // 회색 프레임 영역 그리기
            ctx.save();
            ctx.beginPath();
            ctx.arc(x, y, outer, 0, 2 * Math.PI);
            ctx.arc(x, y, inner, 0, 2 * Math.PI, true);
            ctx.fillStyle = '#e5e7eb';
            ctx.fill();
            ctx.restore();

            // 중앙 로딩 텍스트 그리기
            ctx.save();
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#888';
            ctx.font = '16px sans-serif';
            ctx.fillText('데이터 로딩 중...', x, y);
            ctx.restore();
          }
        }
      }
    }
  });

  // ─── ③ API 호출 후 데이터 가져오기 및 업데이트 ───
  try {
    const res = await fetch('http://localhost:3000/api/stats');
    if (!res.ok) throw new Error(`서버 오류: ${res.status}`);
    const stats = await res.json();

    // -- 카드 정보 업데이트 --
    document.getElementById('totalCount').textContent  = `${stats.totalCount}개`;
    document.getElementById('weakCount').textContent   = `${stats.weakCount}개`;
    document.getElementById('secureCount').textContent = `${stats.secureCount}개`;
    document.getElementById('dupCount').textContent    = `${stats.dupCount}개`;

    // -- Bar 차트 데이터 바인딩 및 리렌더링 --
    const barLabels = stats.byCategory.map(i => i.category);
    const barData   = stats.byCategory.map(i => i.count);
    barChart.data.labels = barLabels;
    barChart.data.datasets[0].data = barData;
    barChart.update();

    // -- Doughnut 차트 데이터 바인딩 및 리렌더링 --
    const pieData = [
      stats.byStrength.strong,
      stats.byStrength.normal,
      stats.byStrength.weak
    ];
    pieChart.data.datasets[0].data = pieData;
    pieChart.update();

  } catch (err) {
    // 에러 발생 시 콘솔에 로깅 (필요 시 사용자 알림 UI 추가)
    console.error('통계 데이터를 불러오는 중 에러:', err);
  }
})();
// ────────────────────────────────────────────────────────────────────────────────
