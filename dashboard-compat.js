(()=>{
  const params=new URLSearchParams(location.search);
  const previewMode=params.get('preview')==='1';

  if(params.get('view')==='dashboard'){
    params.set('view','overview');
    history.replaceState({},'',`${location.pathname}?${params.toString()}${location.hash}`);
  }

  if(previewMode&&window.supabase?.createClient){
    const realCreateClient=window.supabase.createClient.bind(window.supabase);
    window.supabase.createClient=(...args)=>{
      const real=realCreateClient(...args);
      const previewSession={user:{id:'preview-user',email:'preview@getbck.com'}};
      return {
        ...real,
        auth:{
          ...real.auth,
          getSession:async()=>({data:{session:previewSession},error:null}),
          signOut:async()=>({error:null})
        },
        from:table=>{
          if(table==='profiles'){
            return {
              select:()=>({
                eq:()=>({
                  maybeSingle:async()=>({data:{business_name:'BCK Preview'},error:null})
                })
              })
            };
          }
          return real.from(table);
        }
      };
    };
  }

  function relabelAndKeepPreview(){
    const overviewLabel=document.querySelector('[data-nav="overview"] span');
    if(overviewLabel&&overviewLabel.textContent!=='Dashboard') overviewLabel.textContent='Dashboard';

    if(!previewMode) return;
    document.querySelectorAll('a[data-nav],a[href^="dashboard.html?view="]').forEach(a=>{
      const raw=a.getAttribute('href');
      if(!raw) return;
      const u=new URL(raw,location.href);
      if(u.searchParams.get('preview')!=='1'){
        u.searchParams.set('preview','1');
        a.setAttribute('href',u.pathname.split('/').pop()+u.search);
      }
    });
  }

  function enhanceAnalytics(){
    if(new URLSearchParams(location.search).get('view')!=='analytics') return;
    const filters=document.querySelector('.page-head .filters');
    if(!filters||filters.querySelector('[data-custom-range]')) return;

    const custom=document.createElement('button');
    custom.className='filter custom-range-btn';
    custom.type='button';
    custom.dataset.customRange='true';
    custom.innerHTML='<i data-lucide="calendar-days"></i><span>Custom</span><i data-lucide="chevron-down"></i>';
    filters.append(custom);

    const pop=document.createElement('div');
    pop.className='custom-range-popover';
    pop.innerHTML='<div class="custom-range-title">Custom range</div><label>From<input type="date" data-custom-from></label><label>To<input type="date" data-custom-to></label><button type="button" class="btn ink" data-custom-apply>Apply</button>';
    filters.append(pop);

    const today=new Date();
    const seven=new Date(today);
    seven.setDate(today.getDate()-6);
    const fmt=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    pop.querySelector('[data-custom-from]').value=fmt(seven);
    pop.querySelector('[data-custom-to]').value=fmt(today);

    custom.addEventListener('click',e=>{
      e.stopPropagation();
      pop.classList.toggle('open');
    });
    pop.addEventListener('click',e=>e.stopPropagation());
    pop.querySelector('[data-custom-apply]').addEventListener('click',()=>{
      const from=pop.querySelector('[data-custom-from]');
      const to=pop.querySelector('[data-custom-to]');
      if(!from.value||!to.value) return;
      if(from.value>to.value){const t=from.value;from.value=to.value;to.value=t;}
      document.querySelectorAll('[data-range]').forEach(x=>x.classList.remove('active'));
      custom.classList.add('active');
      const chartTitle=document.querySelector('#analyticsTitle');
      if(chartTitle) chartTitle.textContent=`Activity · ${from.value} → ${to.value}`;
      pop.classList.remove('open');
    });
    document.addEventListener('click',()=>pop.classList.remove('open'));
    window.lucide?.createIcons();
  }

  function enhance(){
    relabelAndKeepPreview();
    enhanceAnalytics();
  }

  let scheduled=false;
  const scheduleEnhance=()=>{
    if(scheduled) return;
    scheduled=true;
    requestAnimationFrame(()=>{
      scheduled=false;
      enhance();
    });
  };

  document.addEventListener('DOMContentLoaded',scheduleEnhance);
  const observer=new MutationObserver(mutations=>{
    const meaningful=mutations.some(m=>[...m.addedNodes].some(n=>n.nodeType===1));
    if(meaningful) scheduleEnhance();
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});
})();
