// File: pages/statistics/statistic_renderer.js

// 역할: Chart.js를 사용해 Bar 차트와 Doughnut 차트를 초기화하고,
//      Electron IPC를 통해 통계 데이터를 가져와 카드 및 차트를 업데이트합니다.

window.addEventListener('DOMContentLoaded', async () => {
    // ─── ① 카드 요소 참조 ───
    const totalCountEl  = document.getElementById('totalCount');
    const weakCountEl   = document.getElementById('weakCount');
    const secureCountEl = document.getElementById('secureCount');
    const dupCountEl    = document.getElementById('dupCount');

    // ─── ② Canvas context 가져오기 ───
    const ctxBar = document.getElementById('barChart').getContext('2d');
    const ctxPie = document.getElementById('pieChart').getContext('2d');

    // ─── ③ 초기 빈 차트 생성 ───
    const barChart = new Chart(ctxBar, {
        type: 'bar',
        data: {
            labels: [],    // 초기 레이블 없음
            datasets: [{
                label: '계정 수',
                data: [],
                backgroundColor: 'rgba(54,162,235,0.5)',
                borderColor: 'rgba(54,162,235,1)',
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
                legend: { display: true },
                tooltip: { enabled: true },
                beforeDraw: chart => {
                    // 데이터 로딩 중 메시지 그리기
                    if (!chart.data.labels.length) {
                        const { ctx, chartArea: { left, right, top, bottom } } = chart;
                        ctx.save();
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillStyle = '#888';
                        ctx.font = '16px sans-serif';
                        ctx.fillText('데이터 로딩 중...', (left + right) / 2, (top + bottom) / 2);
                        ctx.restore();
                    }
                }
            }
        }
    });

    const pieChart = new Chart(ctxPie, {
        type: 'doughnut',
        data: {
            labels: ['강력', '보통', '취약'],
            datasets: [{
                data: [0, 0, 0],
                backgroundColor: [
                    'rgba(30,144,255,0.8)',
                    'rgba(255,99,132,0.8)',
                    'rgba(255,165,0,0.8)'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '60%',
            plugins: {
                legend: { position: 'right' },
                tooltip: { enabled: true },
                beforeDraw: chart => {
                    // 모든 값이 0인 경우 로딩 메시지 표시
                    const ds = chart.data.datasets[0].data;
                    if (ds.every(v => v === 0)) {
                        const { ctx } = chart;
                        const meta = chart.getDatasetMeta(0).data[0];
                        const x = meta.x, y = meta.y;
                        const outer = meta.outerRadius, inner = meta.innerRadius;

                        // 회색 프레임
                        ctx.save();
                        ctx.beginPath();
                        ctx.arc(x, y, outer, 0, 2 * Math.PI);
                        ctx.arc(x, y, inner, 0, 2 * Math.PI, true);
                        ctx.fillStyle = '#e5e7eb';
                        ctx.fill();
                        ctx.restore();

                        // 중앙 로딩 텍스트
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

    // ─── ④ IPC 호출하여 통계 데이터 가져오기 ───
    // main 프로세스에서 getStats 핸들러를 구현했다고 가정
    try {
        const res = await window.electronAPI.getStats();
        if (!res.status) {
            console.error('통계 데이터 불러오기 실패:', res.error_message);
            return;
        }
        const stats = res.data;

        // ─── ⑤ 카드 정보 업데이트 ───
        totalCountEl.textContent  = `${stats.totalCount}개`;
        weakCountEl.textContent   = `${stats.weakCount}개`;
        secureCountEl.textContent = `${stats.secureCount}개`;
        dupCountEl.textContent    = `${stats.dupCount}개`;

        // ─── ⑥ Bar 차트 데이터 바인딩 및 업데이트 ───
        const barLabels = stats.byCategory.map(item => item.category);
        const barData   = stats.byCategory.map(item => item.count);
        barChart.data.labels = barLabels;
        barChart.data.datasets[0].data = barData;
        barChart.update();

        // ─── ⑦ Doughnut 차트 데이터 바인딩 및 업데이트 ───
        const pieData = [
            stats.byStrength.strong,
            stats.byStrength.normal,
            stats.byStrength.weak
        ];
        pieChart.data.datasets[0].data = pieData;
        pieChart.update();

    } catch (err) {
        console.error('통계 데이터를 불러오는 중 에러 발생:', err);
    }

    // ────────────────────────────────────────────────────────────────────────────────
    // 추가 액션 버튼 이벤트 바인딩
    // ────────────────────────────────────────────────────────────────────────────────
    document.getElementById('btnViewRecreated')?.addEventListener('click', () => {
        window.electronAPI.navigate('viewRecreated');
    });
    document.getElementById('btnManageLeaked')?.addEventListener('click', () => {
        window.electronAPI.navigate('manageLeaked');
    });
    document.getElementById('btnManageExpiring')?.addEventListener('click', () => {
        window.electronAPI.navigate('manageExpiring');
    });
});