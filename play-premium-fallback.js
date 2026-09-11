(()=>{
'use strict';
window.empty=function(icon,title,copy,action=''){
  const m=payload?.merchant||{};
  const logo=m.logo_url?`<img class="landing-logo" src="${m.logo_url}" alt="${m.business_name||'Store'} logo">`:`<div class="landing-placeholder">${(m.business_name||'S')[0].toUpperCase()}</div>`;
  const msg=copy||m.fallback_message||'No game is live right now. Check back soon.';
  app.innerHTML=`<div class="landing-card fallback-landing">${logo}<h1>${m.business_name||'Your store'}</h1><p>${msg}</p><div class="landing-actions">${m.menu_url?'<button class="landing-menu" id="fallbackMenu">☰ Menu</button>':''}${action||m.fallback_url?'<button class="landing-cta" id="fallbackLink">Continue →</button>':''}</div><div class="campaign-caption">Your permanent BCK QR is still active.</div></div>`;
  if(m.menu_url)document.getElementById('fallbackMenu').onclick=()=>window.open(m.menu_url,'_blank','noopener');
  const target=action||m.fallback_url;if(target)document.getElementById('fallbackLink').onclick=()=>location.href=target;
};
})();