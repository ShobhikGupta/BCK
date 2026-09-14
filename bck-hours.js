(function(root){
  'use strict';
  const days=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
  const time=/^(?:[01]\d|2[0-3]):[0-5]\d$/;
  const minutes=s=>Number(s.slice(0,2))*60+Number(s.slice(3));
  function valid(value){
    if(value===null)return true;
    if(!value||typeof value.timezone!=='string'||!Array.isArray(value.days)||value.days.length!==7)return false;
    try{new Intl.DateTimeFormat('en',{timeZone:value.timezone}).format()}catch{return false}
    return value.days.every(d=>d&&typeof d.open==='boolean'&&(!d.start||time.test(d.start))&&(!d.end||time.test(d.end))&&(!d.open||(time.test(d.start)&&time.test(d.end)&&d.start!==d.end)));
  }
  function parts(date,timezone){
    const p=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23',weekday:'long'}).formatToParts(new Date(date)).map(p=>[p.type,p.value]));
    return {date:`${p.year}-${p.month}-${p.day}`,weekday:days.indexOf(p.weekday),hour:+p.hour,minute:+p.minute};
  }
  const storageKey=id=>'bck-business-hours-'+id;
  function saved(profile,id){
    if(profile&&Object.hasOwn(profile,'business_hours'))return valid(profile.business_hours)?profile.business_hours:null;
    try{const v=JSON.parse(localStorage.getItem(storageKey(id))||'null');return valid(v)?v:null}catch{return null}
  }
  function draft(id,value){if(!valid(value))throw Error('Check business hours and timezone.');localStorage.setItem(storageKey(id),JSON.stringify(value))}
  function openAt(schedule,weekday,minute){
    const today=schedule.days[weekday],previous=schedule.days[(weekday+6)%7];
    if(today.open){const a=minutes(today.start),b=minutes(today.end);if(a<b?minute>=a&&minute<b:minute>=a)return true}
    return previous.open&&minutes(previous.start)>minutes(previous.end)&&minute<minutes(previous.end);
  }
  function peak(events,{from,to,metric='play',schedule=null,timezone}){
    const configured=valid(schedule)&&schedule!==null,tz=configured?schedule.timezone:timezone||Intl.DateTimeFormat().resolvedOptions().timeZone;
    const counts=Array(24).fill(0),visible=new Set();let outside=0;
    if(configured)for(let d=new Date(from+'T12:00:00Z');d<=new Date(to+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+1)){
      const weekday=(d.getUTCDay()+6)%7;for(let h=0;h<24;h++)for(let min=h*60;min<(h+1)*60;min++)if(openAt(schedule,weekday,min)){visible.add(h);break}
    }
    for(const e of events){if(e.event_type!==metric)continue;const p=parts(e.created_at,tz);if(p.date<from||p.date>to)continue;
      if(configured&&!openAt(schedule,p.weekday,p.hour*60+p.minute)){outside++;continue}counts[p.hour]++;if(!configured)visible.add(p.hour);
    }
    return {timezone:tz,configured,outside,bars:[...visible].sort((a,b)=>a-b).map(hour=>({hour,value:counts[hour],label:`${String(hour).padStart(2,'0')}:00–${String((hour+1)%24).padStart(2,'0')}:00`,part:hour<6?'Night':hour<12?'Morning':hour<15?'Noon':hour<18?'Afternoon':hour<22?'Evening':'Night'}))};
  }
  function mount(host,value,{remote=false}={}){
    const data=valid(value)&&value?value:{timezone:Intl.DateTimeFormat().resolvedOptions().timeZone,days:days.map(()=>({open:false,start:'',end:''}))};
    const zones=[...new Set([data.timezone,...(Intl.supportedValuesOf?Intl.supportedValuesOf('timeZone'):['UTC','Asia/Kolkata'])])];
    host.innerHTML=`<h2>Business hours</h2><p>Optional. Tailor hourly engagement to your restaurant’s schedule. A closing time before opening means the following day.</p><p class="field-help">${remote?'Saved with your business profile.':'Database approval pending. Hours saved here stay on this device only.'}</p><label class="bck-hours-enable"><input type="checkbox" data-hours-enable ${value?'checked':''}> Configure business hours</label><div data-hours-fields ${value?'':'hidden'}><label class="field">Restaurant timezone<select data-hours-zone aria-label="Restaurant timezone">${zones.map(z=>`<option ${z===data.timezone?'selected':''}>${z}</option>`).join('')}</select></label><div class="bck-hours-days">${days.map((name,i)=>`<fieldset class="bck-hours-day" data-hours-day="${i}"><legend>${name}</legend><label><input type="checkbox" data-hours-open ${data.days[i].open?'checked':''}> Open</label><label>Opens<input type="time" data-hours-start aria-label="${name} opening time" value="${data.days[i].start||''}"></label><label>Closes<input type="time" data-hours-end aria-label="${name} closing time" value="${data.days[i].end||''}"></label>${i?'<button type="button" class="btn" data-hours-copy>Copy previous day</button>':'<button type="button" class="btn" data-hours-all>Apply Monday to all</button>'}</fieldset>`).join('')}</div></div>`;
    const sync=()=>{const enabled=host.querySelector('[data-hours-enable]').checked;host.querySelector('[data-hours-fields]').hidden=!enabled;host.querySelector('[data-hours-zone]').disabled=!enabled;host.querySelectorAll('[data-hours-day]').forEach(row=>row.querySelectorAll('input[type=time]').forEach(input=>{input.disabled=!enabled||!row.querySelector('[data-hours-open]').checked;input.required=!input.disabled}))};
    host.addEventListener('change',sync);
    const copy=(source,target)=>['open','start','end'].forEach(key=>{const a=source.querySelector('[data-hours-'+key+']'),b=target.querySelector('[data-hours-'+key+']');if(key==='open')b.checked=a.checked;else b.value=a.value});
    host.querySelectorAll('[data-hours-copy]').forEach(b=>b.onclick=()=>{const row=b.closest('fieldset');copy(row.previousElementSibling,row);sync()});
    host.querySelector('[data-hours-all]').onclick=()=>{const rows=[...host.querySelectorAll('fieldset')];rows.slice(1).forEach(row=>copy(rows[0],row));sync()};sync();
    return ()=>{if(!host.querySelector('[data-hours-enable]').checked)return null;const v={timezone:host.querySelector('[data-hours-zone]').value,days:[...host.querySelectorAll('[data-hours-day]')].map(row=>({open:row.querySelector('[data-hours-open]').checked,start:row.querySelector('[data-hours-start]').value,end:row.querySelector('[data-hours-end]').value}))};if(!valid(v))throw Error('Enter different opening and closing times for each open day.');return v};
  }
  const api={valid,parts,saved,draft,mount,peak};root.BCKHours=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
