(()=>{
'use strict';
const $=(s,r=document)=>r.querySelector(s);
function currentGame(){try{return typeof activeGame!=='undefined'?activeGame:null}catch{return null}}
function run(){let g=currentGame();const app=document.getElementById('app');if(!app)return;if(!g||!document.querySelector('.game-head')){app.classList.remove('bck-custom-game-theme');app.style.backgroundImage='';app.style.backgroundColor='';return}let c=null;try{c=payload?.campaign?.game_configs?.[g]||null}catch{}if(!c)return;app.classList.add('bck-custom-game-theme');if(c.backgroundImage){app.style.backgroundImage=`linear-gradient(rgba(255,253,247,.10),rgba(255,253,247,.10)),url("${String(c.backgroundImage).replace(/"/g,'%22')}")`;app.style.backgroundSize='cover';app.style.backgroundPosition='center';app.style.backgroundColor=c.backgroundColor||'#F4F0E6'}else{app.style.backgroundImage='';app.style.backgroundColor=c.backgroundColor||'#F4F0E6'}}
document.addEventListener('DOMContentLoaded',()=>setTimeout(run,120));let q=false;new MutationObserver(()=>{if(q)return;q=true;requestAnimationFrame(()=>{q=false;run()})}).observe(document.documentElement,{childList:true,subtree:true});
})();