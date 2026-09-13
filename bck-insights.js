(function(root){
  'use strict';
  const day=d=>{d=new Date(d);return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')};
  const average=values=>values.length?values.reduce((a,b)=>a+b,0)/values.length:null;
  const unique=rows=>new Set(rows.map(x=>x.visitor_id).filter(Boolean)).size;
  function summarize(events,coupons,{from,to,campaign},gameNames){
    const scoped=x=>!campaign||x.campaign_id===campaign,within=d=>{const n=new Date(d);return n>=from&&n<=to};
    const history=events.filter(e=>scoped(e)&&new Date(e.created_at)<=to),es=history.filter(e=>within(e.created_at));
    const allCoupons=coupons.filter(scoped),cs=allCoupons.filter(c=>within(c.issued_at||c.created_at));
    const plays=es.filter(e=>e.event_type==='play'),scans=es.filter(e=>e.event_type==='scan'),wins=es.filter(e=>e.event_type==='win');
    const completed=plays.filter(e=>e.metadata?.completed===true),red=cs.filter(c=>c.status==='redeemed'&&new Date(c.redeemed_at)<=to);
    const completeCount=rows=>rows.some(e=>typeof e.metadata?.completed==='boolean')?rows.filter(e=>e.metadata.completed).length:null;
    const visitors=new Map();
    for(const e of history.filter(e=>e.visitor_id&&['scan','play','return'].includes(e.event_type))){
      const v=visitors.get(e.visitor_id)||{days:new Set(),last:0};v.days.add(day(e.created_at));v.last=Math.max(v.last,+new Date(e.created_at));visitors.set(e.visitor_id,v);
    }
    const playerIds=new Set(plays.map(e=>e.visitor_id).filter(Boolean));
    const repeat=[...playerIds].filter(id=>visitors.get(id)?.days.size>1).length;
    const cohorts={first:0,repeat:0,vip:0,atRisk:0,lapsed:0};
    for(const v of visitors.values()){const age=(to-v.last)/86400000;cohorts[age>60?'lapsed':age>30?'atRisk':v.days.size>=3?'vip':v.days.size>1?'repeat':'first']++}
    const rows=new Map();for(let d=new Date(from);d<=to;d.setDate(d.getDate()+1))rows.set(day(d),{iso:day(d),label:d.toLocaleDateString(undefined,{day:'numeric',month:'short'}),scans:0,plays:0,wins:0,issued:0,redeems:0,returns:0});
    for(const e of es){const r=rows.get(day(e.created_at)),key={scan:'scans',play:'plays',win:'wins',redeem:'redeems',return:'returns'}[e.event_type];if(r&&key)r[key]++}
    for(const c of cs){const r=rows.get(day(c.issued_at||c.created_at));if(r)r.issued++}
    const peaks=[0,0,0,0];for(const e of es.filter(e=>['scan','play'].includes(e.event_type))){const h=new Date(e.created_at).getHours();peaks[h<12?0:h<15?1:h<18?2:3]++}
    const gameRows=gameNames.map(game=>{
      const p=plays.filter(e=>e.game===game),w=wins.filter(e=>e.game===game),coupons=cs.filter(c=>c.game===game);
      const scores=p.filter(e=>e.metadata?.completed===true&&Number.isFinite(e.metadata?.result?.score)).map(e=>e.metadata.result.score);
      return {game,plays:p.length,completions:completeCount(p),wins:w.length,issued:coupons.length,redeemed:red.filter(c=>c.game===game).length,average:average(scores)};
    });
    const comeback=cs.filter(c=>c.reward_type==='comeback'),comebackRed=red.filter(c=>c.reward_type==='comeback');
    const rewardGroups=new Map();
    for(const c of cs){const key=[c.reward_label,c.game,c.campaign_id,c.reward_type].join('|');const r=rewardGroups.get(key)||{label:c.reward_label||'Unnamed reward',game:c.game,campaign:c.campaign_id,type:c.reward_type,issued:0,redeemed:0};r.issued++;if(red.includes(c))r.redeemed++;rewardGroups.set(key,r)}
    const elapsed=red.map(c=>(new Date(c.redeemed_at)-new Date(c.issued_at||c.created_at))/3600000).filter(n=>Number.isFinite(n)&&n>=0);
    const returnDays=comebackRed.map(c=>(new Date(c.redeemed_at)-new Date(c.issued_at||c.created_at))/86400000).filter(n=>Number.isFinite(n)&&n>=0);
    return {es,cs,scans:scans.length,uniqueScanners:unique(scans),plays:plays.length,completed:completeCount(plays),trackedCompletions:completed.length,wins:wins.length,uniquePlayers:playerIds.size,repeat,cohorts,rows:[...rows.values()],peaks,games:gameRows,issued:cs.length,redeemed:red.length,expired:cs.filter(c=>c.status!=='redeemed'&&c.expires_at&&new Date(c.expires_at)<=to).length,averageRedeemHours:average(elapsed),comeback:comeback.length,comebackRedeemed:comebackRed.length,comebackCustomers:unique(comebackRed),averageReturnDays:average(returnDays),rewards:[...rewardGroups.values()].sort((a,b)=>b.redeemed-a.redeemed||b.issued-a.issued)};
  }
  const api={day,summarize};root.BCKInsights=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
