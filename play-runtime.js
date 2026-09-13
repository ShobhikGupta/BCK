'use strict';
const client=supabase.createClient('https://uxsejwqzxmftyqfncmgf.supabase.co','sb_publishable_7jNw8dRPfmzGo8xJ6SXo-w_rivj0GKd');
const app=document.getElementById('app'),q=new URLSearchParams(location.search),merchantId=q.get('merchant');
const testMode=q.get('test')==='1',G=BCKGames,clamp=G.clamp;
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
const safeURL=value=>{if(typeof value!=='string'||!value.trim())return '';try{const u=new URL(value,location.href);return ['http:','https:'].includes(u.protocol)?u.href:''}catch{return ''}};
let payload=null,activeGame=null,session=null,frame=0,abort=null,lang=localStorage.getItem('bck_customer_language')||localStorage.getItem('bck_customer_lang')||'en';
if(!G.languages[lang])lang='en';
const t=k=>G.translate(k,lang);
function visitorId(){let id=localStorage.getItem('bck_visitor_id');if(!/^[A-Za-z0-9_-]{16,128}$/.test(id||'')){id=crypto.randomUUID();localStorage.setItem('bck_visitor_id',id)}return id}
const visitor=visitorId();
function pendingKey(){return `bck-pending-${merchantId}-${payload?.campaign?.id}-${visitor}`}
function pending(){try{return testMode?null:JSON.parse(sessionStorage.getItem(pendingKey())||'null')}catch{return null}}
function savePending(value){if(!testMode)sessionStorage.setItem(pendingKey(),JSON.stringify(value))}
function cfg(g){return {...G.games[g],...payload?.campaign?.game_configs?.[g]}}
function cleanup(){cancelAnimationFrame(frame);abort?.abort();abort=new AbortController()}
function on(el,event,fn){el.addEventListener(event,fn,{signal:abort.signal})}
function loop(fn){let last=performance.now();function tick(now){const dt=Math.min(.05,(now-last)/1000);last=now;if(fn(dt,now)!==false)frame=requestAnimationFrame(tick)}frame=requestAnimationFrame(tick)}
function header(){
  const h=document.querySelector('.play-top'),m=payload?.merchant||{};document.documentElement.lang=lang;
  h.innerHTML=`<a href="index.html"><img class="bck-wordmark" src="assets/bck-wordmark.svg" alt="bck."></a><select id="customerLanguage" aria-label="Language">${Object.entries(G.languages).map(([k,v])=>`<option value="${k}" ${lang===k?'selected':''}>${v}</option>`).join('')}</select><div class="rc-merchant">${safeURL(m.logo_url)?`<img src="${esc(safeURL(m.logo_url))}" alt="">`:''}<strong>${esc(m.business_name||'bck.')}</strong></div>`;
  h.querySelector('select').disabled=app.dataset.state==='playing';
  h.querySelector('select').onchange=e=>{lang=e.target.value;localStorage.setItem('bck_customer_language',lang);localStorage.setItem('bck_customer_lang',lang);document.documentElement.lang=lang;location.reload()};
}
function state(value){app.dataset.state=value;header()}
function shell(content){app.innerHTML=content;app.querySelector('button')?.focus({preventScroll:true})}
function error(title=t('unavailable'),copy=t('loadError')){cleanup();state('error');shell(`<div class="empty-card"><h1>${esc(title)}</h1><p>${esc(copy)}</p><button class="primary-btn full" onclick="location.reload()">${t('retry')}</button></div>`)}
function showGamePicker(){
  cleanup();state('ready');activeGame=null;
  const games=(payload?.campaign?.games||[]).filter(g=>G.games[g]);
  if(!games.length)return error();
  shell(`<div class="game-head"><h1>${t('choose')}</h1></div><div class="game-picker">${games.map(g=>`<button class="game-option" data-game="${esc(g)}"><span>${G.mark(g)} ${esc(t(g))}</span><span aria-hidden="true">→</span></button>`).join('')}</div>`);
  app.querySelectorAll('[data-game]').forEach(b=>b.onclick=()=>ready(b.dataset.game));
  if(games.length>1){const b=document.createElement('button');b.className='secondary-btn full';b.textContent=t('surprise');b.onclick=()=>ready(G.chooseGame(games,payload.campaign.game_probabilities||payload.campaign.game_configs?.__probabilities));app.append(b)}
}
function ready(game){
  cleanup();activeGame=game;session=null;state('ready');const c=cfg(game);
  app.style.backgroundColor=/^#[0-9a-f]{6}$/i.test(c.backgroundColor)?c.backgroundColor:'#FFFDF7';
  app.style.backgroundImage=safeURL(c.backgroundImage)?`url("${safeURL(c.backgroundImage).replace(/"/g,'%22')}")`:'';
  shell(`<div class="rc-ready">${G.mark(game)}<small>${t('ready')}</small><h1>${esc(t(game))}</h1><p>${t(G.games[game].instruction)}</p><button id="beginGame" class="primary-btn full">${t('play')} →</button><button id="chooseGame" class="secondary-btn full">${t('choose')}</button></div>`);
  document.getElementById('chooseGame').onclick=showGamePicker;
  document.getElementById('beginGame').onclick=async e=>{
    e.target.disabled=true;const previous=pending(),request=previous?.game===game?previous.request:crypto.randomUUID();
    savePending({game,request});
    try{
      if(testMode)session={session_id:request,outcome:sampleOutcome(game,c)};
      else{const {data,error:e}=await client.rpc('begin_bck_play',{p_merchant_id:merchantId,p_campaign_id:payload.campaign.id,p_visitor_id:visitor,p_game:game,p_request_id:request});if(e)throw e;if(!data?.ok)return error(t('unavailable'),t('limit'));session=data}
      savePending({game,request,session});cleanup();state('playing');renderGame(game,c);
    }catch{error()}
  };
}
function sampleOutcome(game,c){
  let choices=[];
  if(game==='Spin the Wheel')choices=(c.segments||[]).map((x,index)=>({...x,index,w:Math.max(0,+x.weight||0)}));
  if(game==='Instant Lottery'){choices=(c.prizes||[]).map(x=>({...x,w:Math.max(0,+x.cards||0)}));choices.push({type:'none',w:Math.max(0,(+c.totalCards||12)-choices.reduce((s,x)=>s+x.w,0))})}
  if(game==='Slot Machine')choices=[{...c.three,matches:3,w:18},{...c.two,matches:2,w:37},{type:'none',matches:0,w:45}];
  let n=Math.random()*choices.reduce((s,x)=>s+x.w,0);return choices.find(x=>(n-=x.w)<0)||{type:'none'};
}
function localReward(game,c,r){if(['Spin the Wheel','Instant Lottery','Slot Machine'].includes(game))return session.outcome;if(game==='Snakes & Ladders')return r.won?c.winner:c.runner;if(r.overflow)return null;return [...(c.tiers||[])].sort((a,b)=>b.min-a.min).find(x=>r.score>=x.min)}
async function finish(result,display){
  savePending({...pending(),game:activeGame,session,result,display});
  cleanup();state('result');
  shell(`<div class="rc-result"><small>${t('result')}</small><h1>${esc(display)}</h1><p id="resultStatus" role="status">${t('loading')}</p><button id="resultNext" class="primary-btn full" disabled>${t('continue')}</button></div>`);
  async function settle(){
    const btn=document.getElementById('resultNext');btn.disabled=true;
    try{
      let data;
      if(testMode){const reward=localReward(activeGame,cfg(activeGame),result);data={ok:true,won:!!reward&&reward.type!=='none',coupon:reward?{reward_label:reward.label,reward_type:reward.type,code:'TEST-NOT-REDEEMABLE',expires_at:new Date(Date.now()+86400000).toISOString()}:null}}
      else{const response=await client.rpc('complete_bck_play',{p_session_id:session.session_id,p_visitor_id:visitor,p_result:result});if(response.error||!response.data?.ok)throw new Error('result_failed');data=response.data}
      document.getElementById('resultStatus').textContent=data.won?t('reward'):t('noReward');btn.disabled=false;btn.textContent=t('continue');btn.onclick=()=>rewardScreen(data);
    }catch{document.getElementById('resultStatus').textContent=t('loadError');btn.disabled=false;btn.textContent=t('retry');btn.onclick=settle}
  }
  await settle();
}
function rewardScreen(data){
  state('reward');const c=data.coupon,controls=payload.campaign.redemption_controls||{},date=x=>new Date(x).toLocaleString(lang),hasMenu=payload?.menu?.exists;
  shell(`<div class="rc-reward"><small>${data.won?t(c.reward_type==='comeback'?'comeback':'instant'):t('noReward')}</small><h1>${data.won?esc(c.reward_label):'↩'}</h1>${data.won?`<p>${t('showStaff')}</p><div class="coupon-code">${esc(c.code)}</div>${c.valid_from?`<p>${t('valid')}: ${esc(date(c.valid_from))}</p>`:''}<p>${c.expires_at?`${t('expires')}: ${esc(date(c.expires_at))}`:t('noExpiry')}</p>${controls.allowCouponCopy!==false?`<button id="copyCode" class="primary-btn full">${t('copy')}</button>`:''}${controls.allowImageDownload?`<button id="saveReward" class="secondary-btn full">${t('save')}</button>`:''}${controls.mode==='automatic'?`<button id="redeemReward" class="secondary-btn full">${t('redeem')}</button>`:''}`:''}${hasMenu?`<a class="secondary-btn full rc-link" href="play.html?merchant=${encodeURIComponent(merchantId)}&menu=1">${t('menu')}</a>`:''}<button id="rewardDone" class="secondary-btn full">${t('done')}</button></div>`);
  document.getElementById('copyCode')?.addEventListener('click',async e=>{try{await navigator.clipboard.writeText(c.code);e.target.textContent=t('copied')}catch{e.target.textContent=c.code}});
  document.getElementById('rewardDone').onclick=()=>{if(!testMode)sessionStorage.removeItem(pendingKey());window.BCKResumeActive=false;showGamePicker()};
  document.getElementById('saveReward')?.addEventListener('click',()=>{const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1350;const x=canvas.getContext('2d');x.fillStyle='#F4F0E6';x.fillRect(0,0,1080,1350);x.fillStyle='#111';x.font='bold 52px sans-serif';x.fillText(payload.merchant.business_name,70,150,940);x.font='bold 64px sans-serif';x.fillText(c.reward_label,70,450,940);x.font='bold 28px monospace';x.fillText(c.code,70,740,940);x.font='28px sans-serif';x.fillText(t('expires')+': '+(c.expires_at?date(c.expires_at):t('noExpiry')),70,950,940);x.fillText(testMode?t('test'):'bck.',70,1200,940);const a=document.createElement('a');a.download='bck-reward.png';a.href=canvas.toDataURL();a.click()});
  document.getElementById('redeemReward')?.addEventListener('click',async e=>{if(testMode){e.target.textContent=t('redeemed');e.target.disabled=true;return}if(!confirm(t('showStaff')))return;e.target.disabled=true;const r=await client.rpc('redeem_public_coupon',{p_coupon_id:c.id,p_visitor_id:visitor});e.target.textContent=!r.error&&r.data?.ok?t('redeemed'):t('unavailable')});
}
function stage(html){shell(`<div class="rc-hud"><strong>${esc(t(activeGame))}</strong><span id="hud" role="status"></span></div><div class="rc-field">${html}</div>`)}
function hud(value){document.getElementById('hud').textContent=value}
function renderGame(game,c){
  if(game==='Spin the Wheel')return wheel(c);
  if(game==='Instant Lottery')return lottery(c);
  if(game==='Slot Machine')return slots(c);
  if(game==='Catch & Win')return catchItems(c);
  if(game==='Tap Speed')return tapSpeed(c);
  if(game==='Snakes & Ladders')return snakes(c);
  if(game==='Perfect Pour')return pour(c);
  if(game==='Pin the Bite')return pin(c);
  if(game==='Stack & Win')return stack(c);
}
function wheel(c){
  const items=c.segments||[],total=items.reduce((s,x)=>s+Math.max(0,+x.weight||0),0)||1,colors=['#6558ff','#c8ff4d','#e6dbca','#b3a9ff'];let angle=0,target=0;
  const grad=items.map((x,i)=>{const start=angle;angle+=Math.max(0,+x.weight||0)/total*360;if(i===session.outcome.index)target=(angle+start)/2;return `${colors[i%4]} ${start}deg ${angle}deg`}).join(',');
  stage(`<div class="wheel-wrap"><div class="wheel-pointer"></div><div id="rcWheel" class="wheel" style="background:conic-gradient(${grad})"></div></div><p class="rc-prizes">${items.map(x=>esc(x.label)).join(' · ')}</p>`);
  let elapsed=0;loop(dt=>{elapsed+=dt;const progress=Math.min(1,elapsed/2.6);document.getElementById('rcWheel').style.transform=`rotate(${(1440-target)*(1-Math.pow(1-progress,4))}deg)`;if(progress===1){finish({},session.outcome.type==='none'?t('noReward'):session.outcome.label);return false}});
}
function lottery(c){
  stage(`<div class="lottery-grid">${Array.from({length:clamp(c.totalCards||12,3,24)},(_,i)=>`<button class="lottery-card" aria-label="${t('play')} ${i+1}">${i+1}</button>`).join('')}</div>`);
  let picked=false;app.querySelectorAll('.lottery-card').forEach(b=>on(b,'click',()=>{if(picked)return;picked=true;b.textContent='✦';b.classList.add('revealed');app.querySelectorAll('button').forEach(x=>x.disabled=true);let delay=0;loop(dt=>{delay+=dt;if(delay>.5){finish({},session.outcome.type==='none'?t('noReward'):session.outcome.label);return false}})}));
}
function slots(c){
  stage('<div class="slot-machine"><div class="slot-reels"><div class="reel">☕</div><div class="reel">🍰</div><div class="reel">🍒</div></div></div>');
  const icons=['☕','🍰','🍒','🍋'],reels=[...app.querySelectorAll('.reel')];let elapsed=0,last=0;
  loop(dt=>{elapsed+=dt;if(elapsed-last>.1){last=elapsed;reels.forEach(x=>x.textContent=icons[Math.floor(Math.random()*icons.length)])}if(elapsed>1.8){const matches=session.outcome.matches;reels.forEach((x,i)=>x.textContent=matches===3||matches===2&&i<2?icons[0]:icons[i]);let pause=0;loop(d=>{pause+=d;if(pause>.5){finish({},session.outcome.type==='none'?t('noReward'):session.outcome.label);return false}});return false}});
}
function tapSpeed(c){
  const duration=clamp(c.duration||7,5,15),countdown=clamp(c.countdown??3,0,5);stage(`<button class="tap-zone rc-tap" id="tapButton">${t('tap')}</button>`);let score=0,elapsed=-countdown;const b=document.getElementById('tapButton');
  on(b,'click',()=>{if(elapsed>=0&&elapsed<duration)score++});loop(dt=>{elapsed+=dt;b.disabled=elapsed<0;hud(elapsed<0?`${t('ready')} · ${Math.ceil(-elapsed)}`:`${Math.max(0,duration-elapsed).toFixed(1)}s · ${score}`);if(elapsed>=duration){finish({score},`${score} ${t('score')}`);return false}});
}
function catchItems(c){
  stage('<div class="catch-area" id="catchArea" tabindex="0" role="application"><div class="basket" id="basket">bck.</div></div>');
  const area=document.getElementById('catchArea'),basket=document.getElementById('basket');area.setAttribute('aria-label',t('catchHelp'));let x=.5,score=0,elapsed=0,spawn=0,items=[];
  const move=e=>{const r=area.getBoundingClientRect();x=clamp((e.clientX-r.left)/r.width,.12,.88)};on(area,'pointermove',move);on(area,'pointerdown',move);on(area,'keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();x=clamp(x+(e.key==='ArrowRight'?.08:-.08),.12,.88)}});area.focus();
  loop(dt=>{elapsed+=dt;spawn+=dt;basket.style.left=`${x*100}%`;if(spawn>.6){spawn=0;const config=(c.items||G.games['Catch & Win'].items),it=config[Math.floor(Math.random()*config.length)],el=document.createElement('div');el.className='fall-item';el.textContent=it.emoji;area.append(el);items.push({el,x:.08+Math.random()*.84,y:-.08,points:clamp(it.points,1,100)})}
    items=items.filter(it=>{it.y+=dt*.45;it.el.style.left=`${it.x*100}%`;it.el.style.top=`${it.y*100}%`;if(it.y>.78&&it.y<.91&&Math.abs(it.x-x)<.14){score+=it.points;it.el.remove();return false}if(it.y>1){it.el.remove();return false}return true});hud(`${Math.ceil(Math.max(0,20-elapsed))}s · ${score}`);if(elapsed>=20){finish({score},`${score} ${t('score')}`);return false}});
}
function pour(c){
  const colors={Coffee:'#6f3c23','Cold Coffee':'#ad7650',Juice:'#e8a222',Milkshake:'#db9caf',Mocktail:'#90b76b','Bubble Tea':'#bea07c'};
  stage(`<div class="pour-scene" style="--liquid:${colors[c.theme]||colors.Coffee}"><div class="pour-stream" id="pourStream"></div><div class="pour-cup"><div class="pour-liquid" id="liquid"></div><div class="pour-target"><span>80%</span></div><div class="cup-shine"></div></div></div><button id="pourHold" class="primary-btn full">${t('hold')}</button>`);
  let amount=0,holding=false,started=false,done=false;const b=document.getElementById('pourHold'),stream=document.getElementById('pourStream');
  const end=()=>{if(!started||done)return;done=true;holding=false;const overflow=amount>100,score=Math.round(clamp(100-Math.abs(amount-80)*2,0,100));finish({score,overflow},`${overflow?t('overflow'):score>=95?t('perfect'):score>=80?t('great'):t('good')} · ${score}%`)};
  on(b,'pointerdown',e=>{b.setPointerCapture(e.pointerId);holding=true;started=true});on(b,'pointerup',end);on(b,'pointercancel',end);
  on(b,'keydown',e=>{if((e.key===' '||e.key==='Enter')&&!e.repeat){e.preventDefault();holding=true;started=true}});on(b,'keyup',e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();end()}});on(window,'blur',end);
  loop(dt=>{if(holding)amount+=dt*(23+amount*.18);stream.classList.toggle('flowing',holding);document.getElementById('liquid').style.height=`${Math.min(100,amount)}%`;hud(`${Math.round(amount)}%`);if(amount>104){end();return false}});
}
function pin(c){
  stage(`<div class="pin-scene"><div class="pin-plate" id="pinPlate"><span class="plate-mark">bck.</span></div><div class="incoming-bite">🥟</div></div><button id="pinButton" class="primary-btn full">${t('tap')} ↑</button>`);
  const plate=document.getElementById('pinPlate');let angle=0,placed=[],elapsed=0,done=false;
  on(document.getElementById('pinButton'),'click',()=>{if(done)return;const target=(90-angle+360)%360;if(placed.some(a=>G.angleDistance(a,target)<27)){done=true;finish({score:placed.length},`${placed.length}/7 ${t('bites')}`);return}placed.push(target);const el=document.createElement('span');el.className='placed-bite';el.textContent='🥟';el.style.transform=`rotate(${target}deg) translateX(96px) rotate(${-target}deg)`;plate.append(el);if(placed.length===7){done=true;finish({score:7},`7/7 ${t('bites')}`)}});
  loop(dt=>{elapsed+=dt;angle=(angle+dt*(48+placed.length*6)* (Math.floor(elapsed/6)%2?-1:1)+360)%360;plate.style.transform=`rotate(${angle}deg)`;hud(`${placed.length}/7`);if(elapsed>45){finish({score:placed.length},`${placed.length}/7 ${t('bites')}`);return false}});
}
function stack(c){
  stage(`<div class="stack-scene" id="stackScene" data-theme="${esc(c.theme||'Burger')}"><div id="tower"><div class="stack-layer base" style="left:25%;width:50%;bottom:0"></div><div class="stack-layer moving" id="movingLayer"></div></div></div><button class="primary-btn full" id="stackButton">${t('tap')} ↓</button>`);
  let width=180,baseX=90,x=0,layers=0,perfect=0,dir=1,elapsed=0;const moving=document.getElementById('movingLayer'),tower=document.getElementById('tower');
  function paint(){moving.style.left=`${x/3.6}%`;moving.style.width=`${width/3.6}%`;moving.style.bottom=`${(layers+1)*28}px`;tower.style.transform=`translateY(${Math.max(0,layers-8)*28}px)`}
  on(document.getElementById('stackButton'),'click',()=>{let hit=G.overlap(x,width,baseX,width);if(hit.width<6)return finish({score:layers,perfect},`${layers} ${t('layers')}`);if(Math.abs(x-baseX)<7){hit={x:baseX,width};perfect++;hud(t('perfect'))}else{const off=document.createElement('div');off.className='stack-offcut';off.style.cssText=moving.style.cssText;off.style.width=`${(width-hit.width)/3.6}%`;tower.append(off);setTimeout(()=>off.remove(),600)}const el=moving.cloneNode();el.removeAttribute('id');el.classList.remove('moving');el.style.left=`${hit.x/3.6}%`;el.style.width=`${hit.width/3.6}%`;tower.append(el);width=hit.width;baseX=hit.x;layers++;if(layers>=20)return finish({score:layers,perfect},`${layers} ${t('layers')}`);x=layers%2?360-width:0;dir=layers%2?-1:1;paint()});
  loop(dt=>{elapsed+=dt;x+=dir*dt*(95+layers*12);if(x<0||x>360-width){x=clamp(x,0,360-width);dir*=-1}paint();if(elapsed>90){finish({score:layers,perfect},`${layers} ${t('layers')}`);return false}});
}
function snakes(c){
  const size=Math.round(clamp(c.boardSize||36,24,60)),cols=6,rows=Math.ceil(size/cols),ladders={3:Math.round(size*.44),7:Math.round(size*.66)},snakes={ [Math.round(size*.92)]:Math.round(size*.38),[Math.round(size*.76)]:Math.round(size*.22)};
  const xy=n=>{const row=Math.floor((n-1)/cols),col=(n-1)%cols;return {x:(row%2?cols-1-col:col)+.5,y:rows-row-.5}};
  const cells=[];for(let r=rows-1;r>=0;r--)for(let col=0;col<cols;col++){const n=r*cols+(r%2?cols-col:col+1);cells.push(`<div class="rc-cell">${n<=size?n:''}</div>`)}
  const paths=[...Object.entries(ladders).map(([a,b])=>{const p=xy(+a),q=xy(b);return `<path class="ladder-path" d="M ${p.x} ${p.y} L ${q.x} ${q.y}"/>`}),...Object.entries(snakes).map(([a,b])=>{const p=xy(+a),q=xy(b);return `<path class="snake-path" d="M ${p.x} ${p.y} C ${p.x-1} ${p.y+1},${q.x+1} ${q.y-1},${q.x} ${q.y}"/>`})].join('');
  stage(`<div class="rc-board" style="--rows:${rows}">${cells.join('')}<svg viewBox="0 0 6 ${rows}" aria-label="${t('snakeHelp')}">${paths}<circle id="playerToken" r=".21" fill="#6558ff" stroke="#111" stroke-width=".05"/><circle id="botToken" r=".16" fill="#c8ff4d" stroke="#111" stroke-width=".05"/></svg></div><p id="turnStatus" role="status">${t('yourTurn')}</p><button class="primary-btn full" id="rollDice">${t('roll')} ⚄</button>`);
  let you=1,bot=1,turns=0,busy=false;const button=document.getElementById('rollDice');
  function paint(){for(const [id,n] of [['playerToken',you],['botToken',bot]]){const p=xy(n),el=document.getElementById(id);if(el){el.setAttribute('cx',p.x);el.setAttribute('cy',p.y)}}hud(`${t('you')} ${you} · ${t('bot')} ${bot}`)}paint();
  const delay=ms=>new Promise(resolve=>{const timer=setTimeout(resolve,ms);abort.signal.addEventListener('abort',()=>{clearTimeout(timer);resolve()},{once:true})});
  async function move(isYou){const roll=1+Math.floor(Math.random()*6);button.textContent=`${t('roll')} ${['⚀','⚁','⚂','⚃','⚄','⚅'][roll-1]}`;let n=isYou?you:bot;for(let i=0;i<roll&&n<size;i++){n++;if(isYou)you=n;else bot=n;paint();await delay(70)}const destination=ladders[n]||snakes[n];if(destination){document.getElementById('turnStatus').textContent=t(ladders[n]?'ladder':'snake');await delay(250);if(isYou)you=destination;else bot=destination;paint();await delay(200)}}
  on(button,'click',async()=>{if(busy)return;busy=true;button.disabled=true;turns++;await move(true);if(you>=size)return finish({won:true,turns},t('perfect'));document.getElementById('turnStatus').textContent=t('botTurn');await delay(200);await move(false);if(bot>=size)return finish({won:false,turns},`${t('bot')} ✓`);document.getElementById('turnStatus').textContent=t('yourTurn');button.disabled=false;busy=false});
}
window.BCKExperienceReady=(async()=>{
  try{
    cleanup();
    if(testMode){let configs={};try{configs=JSON.parse(sessionStorage.getItem('bck-test-'+q.get('draft'))||'{}')}catch{}const game=G.games[q.get('game')]?q.get('game'):Object.keys(G.games)[0];payload={merchant:{business_name:'BCK Game Studio'},campaign:{games:Object.keys(G.games),game_configs:configs,redemption_controls:{allowCouponCopy:true}},menu:{exists:false}};const note=document.createElement('div');note.className='rc-test-banner';note.textContent=t('test');document.body.prepend(note);ready(game);return payload}
    if(!merchantId){error();return null}
    const response=await client.rpc('get_public_experience',{p_merchant_id:merchantId});if(response.error||!response.data?.merchant)throw new Error('unavailable');payload=response.data;header();
    if(payload.campaign){const saved=pending();if(saved&&payload.campaign.games.includes(saved.game)){window.BCKResumeActive=true;activeGame=saved.game;if(saved.result&&saved.session){session=saved.session;await finish(saved.result,saved.display)}else ready(saved.game)}else showGamePicker()}
    await client.rpc('record_public_scan',{p_merchant_id:merchantId,p_visitor_id:visitor});return payload;
  }catch{error();return null}
})();
window.addEventListener('pagehide',cleanup);
