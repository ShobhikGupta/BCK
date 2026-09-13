(()=>{
  'use strict';
  const current=()=>new URLSearchParams(location.search).get('view')||'overview';
  const href=view=>`dashboard.html?view=${view}${new URLSearchParams(location.search).get('preview')==='1'?'&preview=1':''}`;
  const paths={overview:'M3 10 12 3l9 7v11H3z M9 21v-8h6v8',campaigns:'M4 5h16v16H4z M8 2v6 M16 2v6 M4 11h16',qr:'M3 3h6v6H3z M15 3h6v6h-6z M3 15h6v6H3z M15 15h3v3h3v3h-6z',coupons:'M3 5h18v5a2 2 0 0 0 0 4v5H3v-5a2 2 0 0 0 0-4z M15 5v14',more:'M5 12h.1 M12 12h.1 M19 12h.1'};
  const icon=key=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[key]}"/></svg>`;
  let sheet=null;
  function more(button){
    sheet?.remove();sheet=document.createElement('dialog');sheet.className='bck-more-sheet';sheet.setAttribute('aria-labelledby','bckMoreTitle');
    const links=[['menu','Menu'],['analytics','Analytics'],['customers','Customers'],['company','Business profile'],['settings','Settings & account'],['notifications','Notifications'],['support','Help & support']];
    sheet.innerHTML=`<header><h2 id="bckMoreTitle">Workspace</h2><button class="btn" aria-label="Close workspace menu">Close ×</button></header><div class="bck-more-links">${links.map(([view,name])=>`<a href="${href(view)}" ${current()===view?'aria-current="page"':''}>${name}</a>`).join('')}</div>`;
    document.body.append(sheet);button.setAttribute('aria-expanded','true');sheet.querySelector('button').onclick=()=>sheet.close();sheet.addEventListener('click',e=>{if(e.target===sheet){const r=sheet.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)sheet.close()}});sheet.addEventListener('close',()=>{button.setAttribute('aria-expanded','false');button.focus();sheet.remove();sheet=null});sheet.showModal();
  }
  function install(){
    let nav=document.getElementById('bckBottomNav');
    if(!nav){nav=document.createElement('nav');nav.id='bckBottomNav';nav.className='bck-bottom-nav';nav.setAttribute('aria-label','Merchant navigation');nav.innerHTML=[['overview','Dashboard'],['campaigns','Campaigns'],['qr','QR'],['coupons','Coupons']].map(([v,name])=>`<a href="${href(v)}" data-primary="${v}">${icon(v)}<span>${name}</span></a>`).join('')+`<button type="button" aria-haspopup="dialog" aria-expanded="false">${icon('more')}<span>More</span></button>`;document.body.append(nav);nav.querySelector('button').onclick=e=>more(e.currentTarget)}
    const v=current();nav.querySelectorAll('[data-primary]').forEach(a=>{const active=a.dataset.primary===v||(a.dataset.primary==='campaigns'&&v==='new-campaign');if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});const moreButton=nav.querySelector('button');if(!['overview','campaigns','new-campaign','qr','coupons'].includes(v))moreButton.setAttribute('aria-current','page');else moreButton.removeAttribute('aria-current');
    document.querySelectorAll('.field').forEach((field,i)=>{const label=field.querySelector('label'),input=field.querySelector('input,select,textarea');if(label&&input&&!label.htmlFor){if(!input.id)input.id='bckField'+i;label.htmlFor=input.id}});
    document.querySelectorAll('[data-qr-color]').forEach(b=>b.setAttribute('aria-label','QR colour '+b.dataset.qrColor));
    const chip=document.querySelector('.store-chip');if(chip&&!chip.dataset.keyboard){chip.dataset.keyboard='true';chip.tabIndex=0;chip.setAttribute('role','button');chip.setAttribute('aria-label','Open business profile');chip.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();chip.click()}})}
  }
  let scheduled=false;const observer=new MutationObserver(()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;observer.disconnect();try{install()}finally{observer.observe(document.body,{childList:true,subtree:true})}})});
  install();observer.observe(document.body,{childList:true,subtree:true});
})();
