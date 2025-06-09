// File: src/statistics/statistic_renderer.js

window.addEventListener('DOMContentLoaded', async () => {
    console.log('▶ Statistics Renderer Loaded');

    const totalCountEl  = document.getElementById('totalCount');
    const weakCountEl   = document.getElementById('weakCount');
    const secureCountEl = document.getElementById('secureCount');
    const dupCountEl    = document.getElementById('dupCount');

    // 1) 전체 비밀번호 조회
    let allEntries = [];
    try {
        const res = await window.electronAPI.getAllPasswords();
        if (!res.status || !Array.isArray(res.data.data)) throw new Error(res.error_message);
        allEntries = res.data.data;
        totalCountEl.textContent = `${allEntries.length}개`;
    } catch (err) {
        console.error('getAllPasswords 오류:', err);
        totalCountEl.textContent = 'API 오류';
        return;
    }

    // 2) 취약 UID 조회
    let vulnEntries = [];
    try {
        const vulnRes = await window.electronAPI.getVulnerablePasswords();
        if (!vulnRes.status || !Array.isArray(vulnRes.data.data)) throw new Error(vulnRes.error_message);
        vulnEntries = vulnRes.data.data;
    } catch (e) {
        console.error('getVulnerablePasswords 오류:', e);
        return;
    }

    // 3) 상세 비밀번호 조회
    const vulnIds = vulnEntries.map(e => e.UID || e.id || e.uid);
    const pwdMap = {};
    for (const uid of vulnIds) {
        try {
            const detail = await window.electronAPI.getPasswordDetail({ UID: uid });
            if (detail.status && detail.data && typeof detail.data.pwd === 'string') {
                pwdMap[uid] = detail.data.pwd;
            } else pwdMap[uid] = '';
        } catch {
            pwdMap[uid] = '';
        }
    }

    // 4) 분류 함수
    const classify = pw => {
        const isLong  = pw.length >= 8;
        const hasSpec = /[^A-Za-z0-9]/.test(pw);
        if (isLong && hasSpec) return '강력';
        if (isLong)          return '보통';
        return '취약';
    };

    // 5) 집계
    const typeStrength = {};
    const overallCount = { 강력: 0, 보통: 0, 취약: 0 };

    vulnIds.forEach(uid => {
        const entry = allEntries.find(e => (e.UID||e.id||e.uid) === uid) || {};
        const pw    = pwdMap[uid] || '';
        const lvl   = classify(pw);
        overallCount[lvl]++;
        const t = entry.type || 'Unknown';
        typeStrength[t] = typeStrength[t] || { 강력:0, 보통:0, 취약:0 };
        typeStrength[t][lvl]++;
    });

    allEntries.forEach(entry => {
        const uid = entry.UID || entry.id || entry.uid;
        if (!vulnIds.includes(uid)) {
            overallCount['강력']++;
            const t = entry.type || 'Unknown';
            typeStrength[t] = typeStrength[t] || { 강력:0, 보통:0, 취약:0 };
            typeStrength[t]['강력']++;
        }
    });

    console.log('▶ typeStrength:', typeStrength);
    console.log('▶ overallCount:', overallCount);

    // 6) 차트 렌더링
    const ctxBar   = document.getElementById('accountChart').getContext('2d');
    const ctxPie   = document.getElementById('strengthChart').getContext('2d');
    if (!ctxBar || !ctxPie) return;

    const types = Object.keys(typeStrength);

    new Chart(ctxBar, {
        type: 'bar',
        data: {
            labels: types,
            datasets: [
                { label:'취약', data: types.map(t=>typeStrength[t]['취약']||0), backgroundColor:'rgba(239,68,68,0.8)', borderColor:'rgba(239,68,68,1)', borderWidth:1 },
                { label:'보통', data: types.map(t=>typeStrength[t]['보통']||0), backgroundColor:'rgba(245,158,11,0.8)', borderColor:'rgba(245,158,11,1)', borderWidth:1 },
                { label:'강력', data: types.map(t=>typeStrength[t]['강력']||0), backgroundColor:'rgba(72,187,120,0.8)', borderColor:'rgba(72,187,120,1)', borderWidth:1 }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    stacked: false,
                    // ↓ 카테고리 너비 대비 막대 그룹 비율 설정 (0~1, 1이 최대)
                    categoryPercentage: 0.0001,  // 여기서 그래프 폭을 조절할 수 있습니다
                    // ↓ 각 개별 막대 너비 비율 설정 (0~1)
                    barPercentage: 0.9        // 여기서 각 막대 폭을 더 세밀하게 조정합니다
                },
                y: { beginAtZero: true }
            },
            plugins: {
                title: { display: true, text: '그룹별 취약/보통/강력 분포' },
                legend: { position: 'top' }
            }
        }
    });

    new Chart(ctxPie, {
        type: 'doughnut',
        data: {
            labels: ['강력','보통','취약'],
            datasets: [{
                data: [overallCount['강력'], overallCount['보통'], overallCount['취약']],
                backgroundColor: ['rgba(72,187,120,0.8)','rgba(245,158,11,0.8)','rgba(239,68,68,0.8)'],
                borderColor: ['rgba(72,187,120,1)','rgba(245,158,11,1)','rgba(239,68,68,1)'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '60%',
            plugins: {
                title: { display: true, text: '전체 강도 분포' }
            }
        }
    });

    // 7) 재사용된 비밀번호 개수 표시
    try {
        const reuseRes = await window.electronAPI.getReusedPasswords();
        dupCountEl.textContent = reuseRes.status && Array.isArray(reuseRes.data.data)
            ? `${reuseRes.data.data.length}개` : 'API 오류';
    } catch {
        dupCountEl.textContent = 'API 오류';
    }

    // 8) 카드 업데이트
    weakCountEl.textContent   = `${overallCount['취약']}개`;
    secureCountEl.textContent = `${overallCount['강력']}개`;
});
