// File: src/statistics/statistic_renderer.js
window.addEventListener('DOMContentLoaded', async () => {
  console.log('▶ Statistics Renderer Loaded');

  // ─── 기본 요소 ───
  const totalCountEl = document.getElementById('totalCount');
  const weakCountEl  = document.getElementById('weakCount');
  const secureCountEl= document.getElementById('secureCount');
  const dupCountEl   = document.getElementById('dupCount');

  // ─── 버튼 & 모달 참조 ───
  const viewRegeneratedBtn = document.getElementById('viewRegeneratedBtn');
  const regeneratedModal    = document.getElementById('regenerated-modal');
  const regeneratedBody     = document.getElementById('regenerated-modal-body');
  const closeRegeneratedModal  = document.getElementById('closeRegeneratedModal');
  const closeRegeneratedFooter = document.getElementById('closeRegeneratedModalFooter');

  const manageLeakedBtn   = document.getElementById('manageLeakedBtn');
  const leakedModal       = document.getElementById('leaked-modal');
  const leakedBody        = document.getElementById('leaked-modal-body');
  const closeLeakedModal  = document.getElementById('closeLeakedModal');
  const closeLeakedFooter = document.getElementById('closeLeakedModalFooter');

  const manageExpiredBtn   = document.getElementById('manageExpiredBtn');
  const expiredModal       = document.getElementById('expired-modal');
  const expiredBody        = document.getElementById('expired-modal-body');
  const closeExpiredModal  = document.getElementById('closeExpiredModal');
  const closeExpiredFooter = document.getElementById('closeExpiredModalFooter');

  // ─── 1) 전체 비밀번호 조회 ───
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

  // ─── 2~6) 차트 계산 및 렌더링 ───
  const vulnEntries = await (async() => {
    try {
      const vulnRes = await window.electronAPI.getVulnerablePasswords();
      return vulnRes.status && Array.isArray(vulnRes.data.data) ? vulnRes.data.data : [];
    } catch {
      return [];
    }
  })();

  const vulnIds = vulnEntries.map(e => e.UID || e.id || e.uid);
  const pwdMap = {};
  for (const uid of vulnIds) {
    try {
      const detail = await window.electronAPI.getPasswordDetail({ UID: uid });
      pwdMap[uid] = detail.status && detail.data && typeof detail.data.pwd === 'string'
        ? detail.data.pwd : '';
    } catch {
      pwdMap[uid] = '';
    }
  }

  const classify = pw => {
    const isLong = pw.length >= 8;
    const hasSpec = /[^A-Za-z0-9]/.test(pw);
    if (isLong && hasSpec) return '강력';
    if (isLong) return '보통';
    return '취약';
  };

  const typeStrength = {};
  const overallCount = { 강력: 0, 보통: 0, 취약: 0 };

  vulnIds.forEach(uid => {
    const entry = allEntries.find(e => (e.UID||e.id||e.uid) === uid) || {};
    const lvl = classify(pwdMap[uid] || '');
    overallCount[lvl]++;
    const t = entry.type || 'Unknown';
    if (!typeStrength[t]) typeStrength[t] = { 강력: 0, 보통: 0, 취약: 0 };
    typeStrength[t][lvl]++;
  });
  allEntries.forEach(entry => {
    const uid = entry.UID || entry.id || entry.uid;
    if (!vulnIds.includes(uid)) {
      overallCount['강력']++;
      const t = entry.type || 'Unknown';
      if (!typeStrength[t]) typeStrength[t] = { 강력: 0, 보통: 0, 취약: 0 };
      typeStrength[t]['강력']++;
    }
  });

  const ctxBar = document.getElementById('accountChart').getContext('2d');
  const ctxPie = document.getElementById('strengthChart').getContext('2d');
  if (ctxBar && ctxPie) {
    const types = Object.keys(typeStrength);
    new Chart(ctxBar, {
      type: 'bar',
      data: {
        labels: types,
        datasets: [
          { label:'취약', data: types.map(t=>typeStrength[t]['취약']), backgroundColor:'rgba(239,68,68,0.8)', borderColor:'rgba(239,68,68,1)', borderWidth:1 },
          { label:'보통', data: types.map(t=>typeStrength[t]['보통']), backgroundColor:'rgba(245,158,11,0.8)', borderColor:'rgba(245,158,11,1)', borderWidth:1 },
          { label:'강력', data: types.map(t=>typeStrength[t]['강력']), backgroundColor:'rgba(72,187,120,0.8)', borderColor:'rgba(72,187,120,1)', borderWidth:1 }
        ]
      },
      options: { responsive:true, maintainAspectRatio:false,
        scales:{ x:{stacked:false,categoryPercentage:0.0001,barPercentage:0.9}, y:{beginAtZero:true} },
        plugins:{ title:{display:true,text:'그룹별 취약/보통/강력 분포'}, legend:{position:'top'} }
      }
    });

    new Chart(ctxPie, {
      type: 'doughnut',
      data: {
        labels: ['강력','보통','취약'],
        datasets:[{
          data:[overallCount['강력'],overallCount['보통'],overallCount['취약']],
          backgroundColor:['rgba(72,187,120,0.8)','rgba(245,158,11,0.8)','rgba(239,68,68,0.8)'],
          borderColor:['rgba(72,187,120,1)','rgba(245,158,11,1)','rgba(239,68,68,1)'], borderWidth:1
        }]
      },
      options:{ responsive:true, maintainAspectRatio:false, cutout:'60%',
        plugins:{ title:{display:true,text:'전체 강도 분포'} }
      }
    });
  }

  // ─── 7) 재사용된 비밀번호 개수 표시 ───
  try {
    const reuseRes = await window.electronAPI.getReusedPasswords();
    dupCountEl.textContent = reuseRes.status && Array.isArray(reuseRes.data.data)
      ? `${reuseRes.data.data.length}개` : 'API 오류';
  } catch {
    dupCountEl.textContent = 'API 오류';
  }

  // ─── 헬퍼: 카드 생성 ───
  function createEntryCard(entry) {
    const card = document.createElement('div');
    card.className =
      'grid grid-cols-[48px,100px,150px,150px,150px,100px,80px] items-center ' +
      'p-4 bg-white rounded-lg shadow w-full gap-x-4';

    // ① 아이콘
    const iconCell = document.createElement('div'); iconCell.className='w-12 h-12';
    let iconEl;
    if(entry.type==='website'){
      iconEl=document.createElement('div');iconEl.id='favicon';iconEl.className='w-full h-full object-contain';
    } else {
      iconEl=document.createElement('img');
      iconEl.src=`../icon/${entry.type==='wifi'?'wifi':entry.type}.png`;
      iconEl.alt=entry.type;
      iconEl.className='w-full h-full object-contain';
    }
    iconCell.appendChild(iconEl);card.appendChild(iconCell);

    // ② 레이블/서브
    const labelCell=document.createElement('div');labelCell.className='flex flex-col';
    const lbl=document.createElement('span');lbl.className='font-semibold';
    lbl.textContent=entry.type==='card'?entry.bank_name:entry.label;
    const sub=document.createElement('span');sub.className='text-xs text-gray-500';
    switch(entry.type){
      case'website':sub.textContent=entry.url;break;
      case'server':sub.textContent=`Host: ${entry.host} Port: ${entry.port}`;break;
      case'bankbook':sub.textContent=`Bank: ${entry.bankName}`;break;
      case'identity':sub.textContent=`Eng: ${entry.eng_name}`;break;
      case'card':sub.textContent=`CVC: ${entry.cvc}`;break;
      default:sub.textContent='';
    }
    labelCell.append(lbl,sub);card.appendChild(labelCell);

    // ③~⑤ 필드
    const mask=()=> '****';
    let fields=[];
    if(entry.type==='website')fields=[['ID:',entry.id],['PWD:',mask()],['E-Mail:',entry.email]];
    else if(entry.type==='server')fields=[['ID:',entry.id],['PWD:',mask()],['','']];
    else if(entry.type==='bankbook')fields=[['Num:',entry.accountNum],['PWD:',mask()],['','']];
    else if(entry.type==='identity')fields=[['Name:',entry.name],['Citizen:',entry.citizen],['','']];
    else if(entry.type==='card')fields=[['Num:',entry.card_number],['PWD:',mask()],['','']];
    else if(entry.type==='wifi')fields=[['ID:',entry.id],['PWD:',mask()],['','']];
    else if(entry.type==='security')fields=[['',entry.content],['',''],['','']];
    for(let i=0;i<3;i++){
      const[key,val]=fields[i]||['',''];
      const cell=document.createElement('div');
      if(key)cell.innerHTML=`<strong>${key}</strong> ${val}`;
      card.appendChild(cell);
    }

    // ⑥ 타입
    const typeCell=document.createElement('span');
    typeCell.className='text-xs text-gray-400';
    typeCell.textContent=`Type: ${entry.type}`;
    card.appendChild(typeCell);

    // ⑦ 수정 버튼
    const editCell=document.createElement('div');
    const editBtn=document.createElement('button');
    editBtn.textContent='수정';
    editBtn.className='px-2 py-1 text-sm text-blue-600 hover:text-blue-800';
    editBtn.addEventListener('click',()=>{/* TODO */});
    editCell.appendChild(editBtn);card.appendChild(editCell);

    return card;
  }

  // ─── 모달 오픈 헬퍼 ───
  function openModal(btn,apiFn,modalEl,bodyEl){
    btn.addEventListener('click',async()=>{
      let entries=[];
      try{
        const res=await window.electronAPI[apiFn]();
        if(res.status&&Array.isArray(res.data.data))entries=res.data.data;
      }catch{}
      bodyEl.innerHTML='';
      entries.forEach(e=>bodyEl.appendChild(createEntryCard(e)));
      modalEl.classList.remove('hidden');
    });
  }

  openModal(viewRegeneratedBtn,'getReusedPasswords',regeneratedModal,regeneratedBody);
  openModal(manageLeakedBtn,'getLeakedPasswords',leakedModal,leakedBody);
  openModal(manageExpiredBtn,'getExpiredPasswords',expiredModal,expiredBody);

  // ─── 모달 닫기 ───
  [
    [closeRegeneratedModal,regeneratedModal],
    [closeRegeneratedFooter,regeneratedModal],
    [closeLeakedModal,leakedModal],
    [closeLeakedFooter,leakedModal],
    [closeExpiredModal,expiredModal],
    [closeExpiredFooter,expiredModal]
  ].forEach(([btn,modal])=>{
    btn.addEventListener('click',()=>modal.classList.add('hidden'));
    modal.addEventListener('click',e=>{if(e.target===modal)modal.classList.add('hidden')});
  });
});
