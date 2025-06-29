// File: src/shared/shared_renderer.js
// 공통: 카드 생성 및 수정 모달 열기 로직 공유

// 모달 참조 (홈 페이지의 editModal, editForm 등 포함)
const editModal      = document.getElementById('editModal');
const editForm       = document.getElementById('editForm');
const saveEdit       = document.getElementById('saveEdit');
const cancelEdit     = document.getElementById('cancelEdit');

// 이 배열에 현재 모달에 표시된 entry들을 할당해두면, openEditModal에서 조회할 수 있습니다
window.sharedEntries = [];

// 카드 생성 헬퍼
window.createEntryCard = function(entry) {
  const card = document.createElement('div');
  card.className = `
    grid grid-cols-[5%,20%,20%,15%,20%,8%,7%] items-center
    p-4 bg-white rounded-lg shadow w-full gap-x-4 mb-2
    hover:bg-indigo-50 hover:shadow-lg cursor-pointer
  `;
  // 아이콘
  const icon = document.createElement('div'); icon.className='w-12 h-12';
  const img  = document.createElement('img');
  if (entry.type==='website') {
    let d; try{ d=new URL(entry.url).hostname; }catch{ d=entry.url; }
    img.src = `https://logo.clearbit.com/${d}?size=64`;
  } else {
    img.src = `../icon/${entry.type==='wifi'?'wifi':entry.type}.png`;
  }
  img.className='w-full h-full object-contain'; icon.appendChild(img);
  card.appendChild(icon);

  // // 레이블 + 서브텍스트
  // const label = document.createElement('div'); label.className='flex flex-col';
  // label.innerHTML = `
  //   <span class="font-semibold">${entry.type==='card'?entry.bank_name:entry.label}</span>
  //   <span class="text-xs text-gray-500">${
  //     entry.type==='website'?entry.url:
  //         entry.type==='server'?`Host: ${entry.host} Port: ${entry.port}`:
  //             entry.type==='bankbook'?`Bank: ${entry.bank_name}`:
  //                 entry.type==='identity'?`Eng: ${entry.eng_name}`:
  //                     entry.type==='card'?`CVC: ${entry.cvc}`:''
  // }</span>`;
  // card.appendChild(label);

  // 주요 필드
  const mask = ()=>'**********';
  const mask2 = ()=>'********';
  let fields = [];
  if (entry.type==='website')      fields=[['ID',entry.id],['Password',mask()]];
  else if (entry.type==='server')  fields=[['ID',entry.id],['Password',mask2()],['','']];
  else if (entry.type==='bankbook') fields = [['Num', entry.num], ['PWD', mask()], ['','']];
  else if (entry.type==='identity')fields=[['Name',entry.name],['Citizen',entry.citizen],['','']];
  else if (entry.type==='card')    fields=[['Num',entry.card_number],['PWD',mask()],['','']];
  else if (entry.type==='wifi')    fields=[['Name',entry.name],['PWD',mask()],['','']];
  else if (entry.type==='security')fields=[['',entry.content],['',''],['','']];
  for (let i=0;i<3;i++){
    const [k,v] = fields[i]||['',''];
    const cell = document.createElement('div');
    if (k) cell.innerHTML=`<strong>${k}:</strong> <span class="field-value">${v}</span>`;
    else cell.innerHTML=`<span class="field-value">${v}</span>`;
    card.appendChild(cell);
  }

  // 타입 표시
  const t = document.createElement('span');
  t.className='text-xs text-gray-400'; t.textContent=entry.type;
  card.appendChild(t);

  // 클릭 시 수정 모달
  card.addEventListener('click', () => window.openEditModal(entry.UID));
  return card;
};

// 수정 모달 열기
window.openEditModal = async function(uid) {
  const entry = window.sharedEntries.find(e => e.UID === uid);
  if (!entry) return;
  // 모달 표시
  editModal.classList.remove('hidden');
  editModal.classList.add('flex');
  // 배경 클릭 시 닫기
  // Define the closeOnBackground function before using it
  function closeOnBackground(e) {
    if (e.target===editModal) editModal.classList.add('hidden');
  }
  // Remove any previous listener to avoid duplicates
  editModal.removeEventListener('click', closeOnBackground);
  editModal.addEventListener('click', closeOnBackground);
  // 폼 초기화
  editForm.innerHTML='';
  // Label + Favorite
  const favDiv=document.createElement('div'); favDiv.className='mb-4 flex items-center space-x-2';
  favDiv.innerHTML=`
    <input id="edit-label" type="text" value="${entry.label||''}" class="flex-1 border rounded px-2 py-1" />
    <i id="edit-fav-icon" class="fa-star ${entry.favorite?'fa-solid text-yellow-500':'fa-regular text-gray-400'} cursor-pointer text-xl"></i>
  `;
  editForm.appendChild(favDiv);
  // favorite toggle
  const ic=favDiv.querySelector('#edit-fav-icon');
  ic.addEventListener('click',()=>{
    entry.favorite=!entry.favorite;
    ic.classList.toggle('fa-solid',entry.favorite);
    ic.classList.toggle('fa-regular',!entry.favorite);
    ic.classList.toggle('text-yellow-500',entry.favorite);
    ic.classList.toggle('text-gray-400',!entry.favorite);
  });
  // 타입별 세부 필드
  const typeFields = {
    wifi:     [['Name','name','text'],['Password','pwd','password']],
    server:   [['ID','id','text'],['Password','pwd','password'],['Host','host','text'],['Port','port','number']],
    bankbook: [['Account Number','num','text'],['Account Password','pwd','password'],['Bank Name','bank_name','text'],['Master','master','text']],
    identity: [['Citizen ID','citizen','text'],['Name','name','text'],['English Name','eng_name','text'],['Address','address','text'],['Birth Date','birth_date','date']],
    security: [['Content','content','textarea']],
    website:  [['URL','url','url'],['ID','id','text'],['Password','pwd','password'],['Email','email','email']],
    card:     [['Card Number','card_number','text'],['CVC','cvc','text'],['Expiry Date','last_day','month'],['Bank Name','bank_name','text'],['Card Password','pwd','password'],['Name on Card','name','text']]
  };
  (typeFields[entry.type]||[]).forEach(([label,key,inputType])=>{
    const div=document.createElement('div'); div.className='mb-4';
    if(inputType==='textarea') {
      div.innerHTML=`<label class="block text-sm font-medium">${label}</label><textarea id="edit-${key}" class="mt-1 w-full border rounded px-2 py-1">${entry[key]||''}</textarea>`;
    }
    else {
      div.innerHTML=`<label class="block text-sm font-medium">${label}</label><input id="edit-${key}" type="${inputType}" value="${entry[key]||''}" class="mt-1 w-full border rounded px-2 py-1"/>`;
      // If password input, add eye icon for toggle (with relative container)
      if (inputType === 'password') {
        const pwdInput = div.querySelector(`#edit-${key}`);
        // create a relative wrapper
        const wrapper = document.createElement('div');
        wrapper.className = 'relative';
        // move input into wrapper
        pwdInput.parentNode.replaceChild(wrapper, pwdInput);
        wrapper.appendChild(pwdInput);
        // create the eye icon
        const eye = document.createElement('i');
        eye.className = 'fa-solid fa-eye-slash absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer eye-toggle';
        wrapper.appendChild(eye);
        // toggle handler
        eye.addEventListener('click', () => {
          const isMasked = pwdInput.type === 'password';
          pwdInput.type = isMasked ? 'text' : 'password';
          eye.className = isMasked
            ? 'fa-solid fa-eye absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer eye-toggle'
            : 'fa-solid fa-eye-slash absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer eye-toggle';
        });
      }
    }
    editForm.appendChild(div);
  });
  // Comments
  const comDiv=document.createElement('div'); comDiv.className='mb-4';
  comDiv.innerHTML=`<label class="block text-sm font-medium">Comments</label><textarea id="edit-comments" class="mt-1 w-full border rounded px-2 py-1">${entry.comments||''}</textarea>`;
  editForm.appendChild(comDiv);
  // Save / Cancel
  saveEdit.onclick=async()=>{
    const updated={ UID:uid, label:document.getElementById('edit-label').value.trim(), comments:document.getElementById('edit-comments').value.trim(), favorite:entry.favorite.toString() };
    (typeFields[entry.type]||[]).forEach(([_,key])=>{ updated[key]=document.getElementById(`edit-${key}`).value; });
    try{ const res=await window.electronAPI.updatePasswordEntry(updated); if(!res.status) throw new Error(res.error_message); editModal.classList.add('hidden'); window.location.reload(); }catch(e){alert('수정 실패: '+e.message);}  };
  cancelEdit.onclick=() => editModal.classList.add('hidden');
};


// File: src/statistics/statistic_renderer.js
// ─────────────────────────────────────────────────────────────
// 공통 필드 설정: 유형별 필드 목록
// ─────────────────────────────────────────────────────────────
const fieldConfig = {
  wifi: [
    { key: 'name',     label: '이름' },
    { key: 'pwd',      label: '비밀번호' },
    { key: 'comments', label: '설명' }
  ],
  server: [
    { key: 'id',       label: '아이디' },
    { key: 'pwd',      label: '비밀번호' },
    { key: 'host',     label: '호스트' },
    { key: 'port',     label: '포트' },
    { key: 'comments', label: '설명' }
  ],
  bankbook: [
    { key: 'bank_name', label: '은행 이름' },
    { key: 'num',       label: '계좌번호' },
    { key: 'master',    label: '예금주' },
    { key: 'pwd',       label: '계좌 비밀번호' },
    { key: 'comments', label: '설명' }
  ],
  identity: [
    { key: 'name',       label: '이름' },
    { key: 'eng_name',   label: '영문이름' },
    { key: 'address',    label: '주소' },
    { key: 'birth_date', label: '생일' },
    { key: 'citizen',    label: '주민번호' },
    { key: 'comments', label: '설명' }
  ],
  security: [
    { key: 'content',    label: '내용' },
    { key: 'comments',   label: '설명' }
  ],
  website: [
    { key: 'url',        label: 'URL' },
    { key: 'id',         label: '아이디' },
    { key: 'pwd',        label: '비밀번호' },
    { key: 'email',      label: '이메일' },
    { key: 'comments',   label: '설명' }
  ],
  card: [
    { key: 'bank_name',   label: '은행이름' },
    { key: 'name',        label: '예금주' },
    { key: 'card_number', label: '카드 번호' },
    { key: 'cvc',         label: 'CVC' },
    { key: 'last_day',    label: '만료일' },
    { key: 'comments',    label: '설명' }
  ]
};

function showToast(message) {
  // Simple toast implementation
  let toast = document.createElement('div');
  toast.textContent = message;
  toast.style.position = 'fixed';
  toast.style.bottom = '20px';
  toast.style.left = '50%';
  toast.style.transform = 'translateX(-50%)';
  toast.style.backgroundColor = 'rgba(0,0,0,0.7)';
  toast.style.color = 'white';
  toast.style.padding = '10px 20px';
  toast.style.borderRadius = '5px';
  toast.style.zIndex = '9999';
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

window.addEventListener('DOMContentLoaded', async () => {
  const totalCountEl = document.getElementById('totalCount');
  const weakCountEl  = document.getElementById('weakCount');
  const normalCountEl= document.getElementById('dupCount');
  const secureCountEl= document.getElementById('secureCount');
  const ctxPie = document.getElementById('strengthChart').getContext('2d');
  const ctxBar = document.getElementById('accountChart').getContext('2d');

  // 1) 개수 조회
  try {
    const [wRes,nRes,sRes] = await Promise.all([
      window.electronAPI.getVulnerablePasswordCount({type:'weak'}),
      window.electronAPI.getVulnerablePasswordCount({type:'normal'}),
      window.electronAPI.getVulnerablePasswordCount({type:'strong'})
    ]);
    if(!wRes.status||!nRes.status||!sRes.status) throw 0;
    const weak=wRes.data.total, normal=nRes.data.total, strong=sRes.data.total;
    totalCountEl.textContent=`${weak+normal+strong}개`;
    weakCountEl.textContent=`${weak}개`;
    normalCountEl.textContent=`${normal}개`;
    secureCountEl.textContent=`${strong}개`;
  } catch { totalCountEl.textContent=weakCountEl.textContent=normalCountEl.textContent=secureCountEl.textContent='API 오류'; }

  // 2) Doughnut
  new Chart(ctxPie, {
    type: 'doughnut',
    data: {
      labels: ['강력', '보통', '취약'],
      datasets: [{
        data: [parseInt(secureCountEl.textContent),
          parseInt(normalCountEl.textContent),
          parseInt(weakCountEl.textContent)],
        spacing: 0,
        borderWidth: 0,
        backgroundColor: ['rgba(72,187,120,0.8)', 'rgba(245,158,11,0.8)', 'rgba(239,68,68,0.8)'],
        cutout: '60%',
        hoverOffset: 20
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom' },
        title: { display: true, text: '강도별 분포' }
      }
    }
  });

  // 3) Bar (Website, Server)
  const types=['website','server'], strongBy=[], normalBy=[], weakBy=[];
  for(let t of types){ const [s,n,w]=await Promise.all([
    window.electronAPI.getVulnerablePasswordCount({type:'strong',tag:t}),
    window.electronAPI.getVulnerablePasswordCount({type:'normal',tag:t}),
    window.electronAPI.getVulnerablePasswordCount({type:'weak',tag:t})
  ]);
    strongBy.push(s.status?s.data.total:0);
    normalBy.push(n.status?n.data.total:0);
    weakBy.push(w.status?w.data.total:0);
  }
  const grad=ctxBar.createLinearGradient(0,0,0,200); grad.addColorStop(0,'rgba(72,187,120,1)'); grad.addColorStop(1,'rgba(72,187,120,0.5)');
  new Chart(ctxBar,{ type:'bar', data:{ labels:types.map(t=>t.charAt(0).toUpperCase()+t.slice(1)), datasets:[
      {label:'취약',data:weakBy, backgroundColor:'rgba(239,68,68,0.8)',
        borderRadius:6,
        categoryPercentage:0.7,
        barPercentage:0.7
      }, {label:'보통',data:normalBy,
          backgroundColor:'rgba(245,158,11,0.8)',
          // borderRadius:6,
          categoryPercentage:0.7,
          barPercentage:0.7
        }, {label:'강력',data:strongBy,
          backgroundColor:grad,
          // borderRadius:6,
          categoryPercentage:0.7,
          barPercentage:0.7
  } ]
    }, options:{ responsive:true,
      maintainAspectRatio:false,
      scales:{ x:{grid:{display:false}}, y:{beginAtZero:true} },
      plugins:{ legend:{position:'top'},
        title:{display:true,text:'타입별 강도 분포'} } } });

  // 4) 재사용 / 오래된 모달 로직
  const reusedModal = document.getElementById('regenerated-modal');
  const reusedBody  = document.getElementById('regenerated-modal-body');
  document.getElementById('viewRegeneratedBtn').addEventListener('click', async()=>{
    window.sharedEntries = [];
    reusedBody.innerHTML='로딩 중...';
    const res = await window.electronAPI.getReusedPasswords();
    reusedBody.innerHTML='';
    if(!res.status){ reusedBody.innerHTML=`<p class="text-red-500">불러오기 실패: ${res.error_message}</p>`; }
    else{
      // 그룹이 2차원 배열로 옴
      const groups = res.data.data;
      window.sharedEntries = groups.flat();
      groups.forEach(gr => {
        const grpDiv = document.createElement('div');
        grpDiv.className = 'bg-white p-4 rounded-lg shadow mb-4';
        gr.forEach(e => {
          const card = window.createEntryCard(e);
          grpDiv.appendChild(card);
        });
        reusedBody.appendChild(grpDiv);
      });
    }
    reusedModal.classList.remove('hidden');
  });
  ['closeRegeneratedModal','closeRegeneratedModalFooter'].forEach(id=>document.getElementById(id).addEventListener('click',()=>reusedModal.classList.add('hidden')));
  reusedModal.addEventListener('click',e=>{if(e.target===reusedModal)reusedModal.classList.add('hidden');});

  // ─── 6) 오래된 비밀번호 모달 (버튼 정상 작동하도록 관리) ───
  const expiredModal = document.getElementById('expired-modal');
  const expiredBody  = document.getElementById('expired-modal-body');
  document.getElementById('manageExpiredBtn').addEventListener('click', async () => {
    window.sharedEntries = [];
    expiredBody.innerHTML = '로딩 중...';

    const res = await window.electronAPI.getOldPasswords();
    expiredBody.innerHTML = '';

    if (!res.status) {
      // API 오류
      expiredBody.innerHTML = `<p class="text-red-500">불러오기 실패: ${res.error_message}</p>`;
    } else if (Array.isArray(res.data.data) && res.data.data.length === 0) {
      // 데이터가 빈 배열인 경우
      expiredBody.innerHTML = `
        <div class="flex items-center justify-center h-full">
          <p class="text-gray-500 text-lg">오래된 비밀번호 항목이 없습니다.</p>
        </div>`;
    } else {
      // 정상적인 데이터 렌더링
      window.sharedEntries = res.data.data;
      res.data.data.forEach(entry => {
        const card = createEntryCard(entry);
        // Remove or disable default click-to-edit logic: override with our own
        card.addEventListener('click', async (evt) => {
          evt.stopPropagation();
          try {
            const res = await window.electronAPI.getPasswordDetail({ UID: entry.UID });
            if (res.status && res.data) {
              entry.pwd = res.data.pwd || res.data.password;
            }
            window.sharedEntries = [entry];
            openEditModal(entry.UID);
          } catch {
            showToast('비밀번호 상세 정보를 불러오는데 실패했습니다.');
          }
        });
        expiredBody.appendChild(card);
      });
    }

    expiredModal.classList.remove('hidden');
  });
  ['closeExpiredModal','closeExpiredModalFooter'].forEach(id =>
      document.getElementById(id).addEventListener('click', () =>
          expiredModal.classList.add('hidden')
      )
  );
  expiredModal.addEventListener('click', e => {
    if (e.target === expiredModal) expiredModal.classList.add('hidden');
  });

  // ─── 6) 오래된 비밀번호 모달 (버튼 정상 작동하도록 관리) ───
  const leakedModal = document.getElementById('leaked-modal');
  const leakedBody  = document.getElementById('leaked-modal-body');
  document.getElementById('manageLeakedBtn').addEventListener('click', async () => {
    window.sharedEntries = [];
    leakedBody.innerHTML = '로딩 중...';

    const res = await window.electronAPI.getLeakedPasswords();
    leakedBody.innerHTML = '';

    if (!res.status) {
      // API 오류
      leakedBody.innerHTML = `<p class="text-red-500">불러오기 실패: ${res.error_message}</p>`;
    } else if (Array.isArray(res.data.data) && res.data.data.length === 0) {
      // 데이터가 빈 배열인 경우
      leakedBody.innerHTML = `
        <div class="flex items-center justify-center h-full">
          <p class="text-gray-500 text-lg">유출된 비밀번호 항목이 없습니다.</p>
        </div>`;
    } else {
      // 정상적인 데이터 렌더링
      window.sharedEntries = res.data.data;
      res.data.data.forEach(entry => {
        const card = createEntryCard(entry);
        // Remove or disable default click-to-edit logic: override with our own
        card.addEventListener('click', async (evt) => {
          evt.stopPropagation();
          try {
            const res = await window.electronAPI.getPasswordDetail({ UID: entry.UID });
            if (res.status && res.data) {
              entry.pwd = res.data.pwd || res.data.password;
            }
            window.sharedEntries = [entry];
            openEditModal(entry.UID);
          } catch {
            showToast('비밀번호 상세 정보를 불러오는데 실패했습니다.');
          }
        });
        leakedBody.appendChild(card);
      });
    }

    leakedModal.classList.remove('hidden');
  });
  ['closeLeakedModal','closeLeakedModalFooter'].forEach(id =>
      document.getElementById(id).addEventListener('click', () =>
          leakedModal.classList.add('hidden')
      )
  );
  leakedModal.addEventListener('click', e => {
    if (e.target === expiredModal) leakedModal.classList.add('hidden');
  });


});
// ─────────────────────────────────────────────────────────────
// 카드 생성 헬퍼: 홈 페이지와 동일한 레이아웃 사용
// ─────────────────────────────────────────────────────────────
const typeIconClasses = {
  wifi: 'fa-solid fa-wifi text-indigo-500',
  server: 'fa-solid fa-server text-blue-400',
  bankbook: 'fa-solid fa-building-columns text-green-500',
  identity: 'fa-solid fa-id-card text-purple-400',
  security: 'fa-solid fa-shield-halved text-red-400',
  website: 'fa-solid fa-globe text-gray-600',
  card: 'fa-regular fa-credit-card text-pink-500'
};
window.createEntryCard = function(entry) {
  const card = document.createElement('div');
  card.className = `
    flex flex-col space-y-3 p-4 bg-white rounded-xl border border-gray-200 shadow-md w-full mb-4
    min-h-[240px]
  `;
  card.dataset.uid = entry.UID;

  // 1) Header: Icon + Label + favorite, edit, delete
  const header = document.createElement('div');
  header.className = 'flex justify-between items-center mb-2 border-b border-gray-200 pb-2';
  const leftDiv = document.createElement('div');
  leftDiv.className = 'flex items-center';
  let iconEl;
  if (entry.type === 'website') {
    let domain;
    try { domain = new URL(entry.url).hostname; }
    catch { domain = entry.url.replace(/^https?:\/\//, '').split('/')[0]; }
    iconEl = document.createElement('img');
    iconEl.src = `https://logo.clearbit.com/${domain}?size=32`;
    iconEl.alt = 'favicon';
    iconEl.className = 'w-8 h-8 object-contain mr-3';
  } else {
    iconEl = document.createElement('i');
    iconEl.className = `${typeIconClasses[entry.type] || 'fa-solid fa-key text-gray-600'} text-2xl mr-3`;
  }
  leftDiv.appendChild(iconEl);
  const title = document.createElement('span');
  title.className = 'text-lg font-semibold';
  title.textContent = entry.label || entry.type;
  leftDiv.appendChild(title);
  const modSpan = document.createElement('span');
  modSpan.className = 'text-sm text-gray-500 ml-4';
  modSpan.textContent = `최근 수정일: ${entry.modified_at}`;
  leftDiv.appendChild(modSpan);
  header.appendChild(leftDiv);

  const rightDiv = document.createElement('div');
  rightDiv.className = 'flex items-center space-x-2';
  const favIcon = document.createElement('i');
  favIcon.className = (entry.favorite === true || entry.favorite === 'true')
    ? 'fa-solid fa-star text-yellow-500 text-xl cursor-pointer'
    : 'fa-regular fa-star text-gray-400 text-xl cursor-pointer';
  favIcon.addEventListener('click', async e => {
    e.stopPropagation();
    const cardEl = document.querySelector(`[data-uid="${entry.UID}"]`);
    const firstRect = cardEl.getBoundingClientRect();
    entry.favorite = !(entry.favorite === true || entry.favorite === 'true');
    favIcon.classList.toggle('fa-solid', entry.favorite);
    favIcon.classList.toggle('fa-regular', !entry.favorite);
    favIcon.classList.toggle('text-yellow-500', entry.favorite);
    favIcon.classList.toggle('text-gray-400', !entry.favorite);
    try {
      await window.electronAPI.updatePasswordEntry({
        UID: entry.UID,
        favorite: entry.favorite.toString()
      });
    } catch {}
    const container = document.getElementById('card-container');
    if (entry.favorite) container.prepend(cardEl);
    else container.appendChild(cardEl);
    const lastRect = cardEl.getBoundingClientRect();
    const deltaY = firstRect.top - lastRect.top;
    cardEl.style.transform = `translateY(${deltaY}px)`;
    cardEl.style.transition = 'transform 300ms ease';
    requestAnimationFrame(() => { cardEl.style.transform = ''; });
  });
  const editIcon = document.createElement('i');
  editIcon.className = 'fa-solid fa-pen text-blue-500 text-xl cursor-pointer';
  editIcon.addEventListener('click', e => {
    e.stopPropagation();
    openEditModal(entry.UID);
  });
  const delIcon = document.createElement('i');
  delIcon.className = 'fa-solid fa-trash text-red-500 text-xl cursor-pointer ml-3';
  delIcon.addEventListener('click', async e => {
    e.stopPropagation();
    if (!confirm('정말 삭제하시겠습니까?')) return;
    try {
      const res = await window.electronAPI.deletePasswordEntry(entry.UID);
      if (res.status) {
        removeCard(entry.UID);
        showToast('삭제되었습니다.');
      } else {
        showToast('삭제 실패: ' + res.error_message, 'error');
      }
    } catch {
      showToast('삭제 오류', 'error');
    }
  });
  rightDiv.append(favIcon, editIcon, delIcon);
  header.appendChild(rightDiv);
  card.appendChild(header);

  // 2) Field list
  const config = fieldConfig[entry.type] || [];
  config.forEach(({ key, label }) => {
    const value = entry[key];
    if (key !== 'pwd' && (value == null || value === '')) return;
    const row = document.createElement('div');
    row.className = 'flex flex-wrap mb-2 bg-gray-50 p-2 rounded-lg';
    const keyEl = document.createElement('span');
    keyEl.className = 'font-medium text-indigo-600 mr-2';
    keyEl.textContent = `${label}:`;
    const valEl = document.createElement('span');
    valEl.classList.add('break-words','text-gray-800');
    if (key === 'pwd') {
      valEl.textContent = '••••••';
      let revealed = null;
      window.electronAPI.getPasswordDetail({ UID: entry.UID })
        .then(res => {
          if (res.status && res.data.pwd) {
            revealed = res.data.pwd;
            valEl.textContent = '*'.repeat(revealed.length);
          }
        });
      valEl.addEventListener('mouseenter', async () => {
        const res = await window.electronAPI.getPasswordDetail({ UID: entry.UID });
        if (res.status && res.data.pwd) {
          revealed = res.data.pwd;
          valEl.textContent = revealed;
        }
      });
      valEl.addEventListener('mouseleave', () => {
        valEl.textContent = revealed ? '*'.repeat(revealed.length) : '••••••';
      });
      valEl.addEventListener('click', async e => {
        e.stopPropagation();
        const toCopy = revealed || (await window.electronAPI.getPasswordDetail({ UID: entry.UID })).data.pwd;
        await navigator.clipboard.writeText(toCopy);
        showToast('비밀번호 복사됨');
      });
    } else {
      valEl.textContent = value;
      valEl.classList.add('cursor-pointer');
      valEl.addEventListener('click', e => {
        e.stopPropagation();
        navigator.clipboard.writeText(value);
        showToast('복사되었습니다.');
      });
    }
    row.append(keyEl, valEl);
    card.appendChild(row);
  });

  return card;
};