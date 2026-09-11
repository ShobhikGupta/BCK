(()=>{
'use strict';
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
let prepared=false;
function preparePayload(){try{if(!payload?.merchant)return false;if(payload.merchant.menu_asset_url){payload.merchant.menu_url=payload.merchant.menu_asset_url;payload.merchant.__menuSource='upload'}prepared=true;return true}catch{return false}}
function polish(){if(!preparePayload())return;const mini=$('#merchantMini');if(mini){mini.title=payload.merchant.business_name||'Store';const img=$('img',mini);if(img)img.alt=(payload.merchant.business_name||'Store')+' logo'}const menu=$('#ppMenu');if(menu&&payload.merchant.__menuSource==='upload'&&!menu.dataset.uploaded){menu.dataset.uploaded='1';menu.title=payload.merchant.menu_asset_name||'Open uploaded menu';const note=document.createElement('div');note.className='menu-source-note';note.textContent=payload.merchant.menu_asset_name?`Menu: ${payload.merchant.menu_asset_name}`:'Uploaded menu';menu.insertAdjacentElement('afterend',note)}const powered=$('.powered-bck');if(powered){powered.setAttribute('aria-label','Powered by bck.');powered.title='Powered by bck.'}}
function run(){polish()}
document.addEventListener('DOMContentLoaded',()=>{let tries=0;const t=setInterval(()=>{run();if(prepared||++tries>40)clearInterval(t)},100)});let q=false;new MutationObserver(ms=>{if(q||!ms.some(m=>[...m.addedNodes].some(n=>n.nodeType===1)))return;q=true;requestAnimationFrame(()=>{q=false;run()})}).observe(document.documentElement,{childList:true,subtree:true});
})();