(()=>{
  const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
  function normalizeLocal(){
    try{
      const s=JSON.parse(localStorage.getItem('bck_console_state')||'{}'),arr=s.campaigns||[];
      let seen=false,changed=false;
      arr.forEach(c=>{if(c.status==='active'){if(seen){c.status='paused';changed=true}else seen=true}});
      if(changed)localStorage.setItem('bck_console_state',JSON.stringify({...s,campaigns:arr}));
    }catch{}
  }
  function cleanupBuilder(){
    if(new URLSearchParams(location.search).get('view')!=='new-campaign')return;
    $$('.toggle-row').forEach(row=>{
      const title=$('.toggle-copy strong',row)?.textContent.trim();
      if(title==='Staff-assisted redemption'||title==='Track repeat visit')row.remove();
    });
    $$('.form-section').forEach(panel=>{
      if($('h3',panel)?.textContent.trim()==='Reward setup')panel.remove();
    });
    const grid=$('.wizard-panel[data-step="3"] .grid2');
    if(grid&&grid.children.length===1)grid.style.gridTemplateColumns='1fr';
  }
  function fixRefresh(){
    if(new URLSearchParams(location.search).get('view')!=='coupons')return;
    const b=$('[data-toast="Coupon data refreshed"]');
    if(!b||b.dataset.realRefresh)return;
    b.dataset.realRefresh='1';b.removeAttribute('data-toast');
    b.onclick=()=>location.reload();
  }
  function removePlaceholderCopy(){
    $$('.qr-actions [data-toast]').forEach(b=>b.removeAttribute('data-toast'));
  }
  function run(){cleanupBuilder();fixRefresh();removePlaceholderCopy()}
  normalizeLocal();
  document.addEventListener('DOMContentLoaded',run);
  let queued=false;
  new MutationObserver(ms=>{if(queued||!ms.some(m=>[...m.addedNodes].some(n=>n.nodeType===1)))return;queued=true;requestAnimationFrame(()=>{queued=false;run()})}).observe(document.documentElement,{childList:true,subtree:true});
})();