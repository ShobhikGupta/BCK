(()=>{
  'use strict';
  const current=()=>new URLSearchParams(location.search).get('view')||'overview';
  const href=view=>`dashboard.html?view=${view}${new URLSearchParams(location.search).get('preview')==='1'?'&preview=1':''}`;
  const paths={overview:'M3 10 12 3l9 7v11H3z M9 21v-8h6v8',campaigns:'M4 5h16v16H4z M8 2v6 M16 2v6 M4 11h16',qr:'M3 3h6v6H3z M15 3h6v6h-6z M3 15h6v6H3z M15 15h3v3h3v3h-6z',coupons:'M3 5h18v5a2 2 0 0 0 0 4v5H3v-5a2 2 0 0 0 0-4z M15 5v14',menu:'M4 4h16v16H4z M8 8h8 M8 12h8 M8 16h5',analytics:'M4 3v17h17 M8 16v-5 M13 16V7 M18 16V4',customers:'M8 4a3 3 0 1 0 0 6 3 3 0 0 0 0-6 M2 21v-4a6 6 0 0 1 12 0v4 M16 5a3 3 0 0 1 0 6 M18 14a5 5 0 0 1 4 5v2',settings:'m10 3-.7 2.3-2 .9L5 5.5 3 9l1.6 1.7v2.6L3 15l2 3.5 2.3-.7 2 .9L10 21h4l.7-2.3 2-.9 2.3.7 2-3.5-1.6-1.7v-2.6L21 9l-2-3.5-2.3.7-2-.9L14 3Z M15 12a3 3 0 1 0-6 0 3 3 0 0 0 6 0'};
  const icon=key=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[key]}"/></svg>`;
  function install(){
    let nav=document.getElementById('bckBottomNav');
    if(!nav){nav=document.createElement('nav');nav.id='bckBottomNav';nav.className='bck-bottom-nav';nav.setAttribute('aria-label','Merchant navigation');nav.innerHTML=[['overview','Dashboard'],['campaigns','Campaigns'],['coupons','Coupons'],['qr','QR'],['menu','Menu'],['analytics','Analytics'],['customers','Customers']].map(([v,name])=>`<a href="${href(v)}" data-primary="${v}">${icon(v)}<span>${name}</span></a>`).join('');document.body.append(nav)}
    const v=current();nav.querySelectorAll('[data-primary]').forEach(a=>{const active=a.dataset.primary===v||(a.dataset.primary==='campaigns'&&v==='new-campaign');if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});
    if(nav.dataset.active!==v){nav.dataset.active=v;const active=nav.querySelector('[aria-current]');if(active)nav.scrollLeft=active.offsetLeft-(nav.clientWidth-active.clientWidth)/2}
    const row=document.querySelector('.bck-brand-row');if(row&&!row.querySelector('.bck-header-settings')){const gear=document.createElement('a');gear.className='bck-header-settings';gear.href=href('settings');gear.setAttribute('aria-label','Settings');gear.innerHTML=icon('settings');row.append(gear)}
    document.querySelectorAll('.field').forEach((field,i)=>{const label=field.querySelector('label'),input=field.querySelector('input,select,textarea');if(label&&input&&!label.htmlFor){if(!input.id)input.id='bckField'+i;label.htmlFor=input.id}});
    document.querySelectorAll('[data-qr-color]').forEach(b=>b.setAttribute('aria-label','QR colour '+b.dataset.qrColor));
    const chip=document.querySelector('.store-chip');if(chip&&!chip.dataset.keyboard){chip.dataset.keyboard='true';chip.tabIndex=0;chip.setAttribute('role','button');chip.setAttribute('aria-label','Open business profile');chip.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();chip.click()}})}
  }
  let scheduled=false;const observer=new MutationObserver(()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;observer.disconnect();try{install()}finally{observer.observe(document.body,{childList:true,subtree:true})}})});
  install();observer.observe(document.body,{childList:true,subtree:true});addEventListener('resize',()=>{const nav=document.getElementById('bckBottomNav');if(nav)nav.dataset.active='';install()});
})();
