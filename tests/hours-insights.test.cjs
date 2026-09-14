const test=require('node:test'),assert=require('node:assert/strict'),{readFileSync}=require('node:fs'),{PGlite}=require('@electric-sql/pglite');
const H=require('../bck-hours.js'),I=require('../bck-insights.js');
const schedule=(start='09:00',end='21:00')=>({timezone:'Asia/Kolkata',days:Array.from({length:7},()=>({open:true,start,end}))});
test('hourly engagement respects metric, timezone, overnight hours and range',()=>{
  const events=[{created_at:'2026-09-13T04:30:00Z',event_type:'play',campaign_id:'a',visitor_id:'v'},{created_at:'2026-09-13T04:45:00Z',event_type:'scan',campaign_id:'a'},{created_at:'2026-09-13T19:30:00Z',event_type:'play',campaign_id:'a',visitor_id:'v'}];
  const options={from:'2026-09-13',to:'2026-09-13',schedule:schedule()};
  const peak=H.peak(events,options);assert.equal(peak.bars.length,12);assert.equal(peak.bars[1].value,1);assert.equal(peak.bars.reduce((n,b)=>n+b.value,0),1);
  assert.equal(H.peak(events,{...options,metric:'redeem'}).bars.reduce((n,b)=>n+b.value,0),0);
  assert.equal(H.peak(events,{from:'2026-09-14',to:'2026-09-14',schedule:schedule('18:00','02:00')}).bars.find(b=>b.hour===1).value,1);
  assert.equal(H.peak([],{from:'2026-09-13',to:'2026-09-13'}).bars.length,0,'No invented opening hours');
  assert.equal(H.valid(schedule('09:00','09:00')),false);assert.equal(H.valid({...schedule(),timezone:'Fake/Zone'}),false);
  const m=I.summarize(events,[],{from:new Date('2026-09-14T00:00:00'),to:new Date('2026-09-14T23:59:59'),campaign:'a',timezone:'Asia/Kolkata'},['Tap Speed']);
  assert.equal(m.plays,1);assert.equal(m.repeat,1);assert.equal(m.completed,null);assert.equal(m.rows[0].plays,1);
  assert.equal(I.summarize(events,[],{from:new Date('2026-09-14T00:00:00'),to:new Date('2026-09-14T23:59:59'),campaign:'other',timezone:'Asia/Kolkata'},[]).plays,0);
});
test('business hours migration is additive and rejects malformed schedules',async()=>{
  const db=new PGlite();try{
    await db.exec('create table profiles(id int primary key, business_name text);insert into profiles values(1,\'Preserved\')');
    await db.exec(readFileSync('supabase/migrations/20260914040924_merchant_business_hours.sql','utf8'));
    await db.query('update profiles set business_hours=$1 where id=1',[JSON.stringify(schedule())]);
    assert.equal((await db.query('select business_name from profiles')).rows[0].business_name,'Preserved');
    await assert.rejects(db.query('update profiles set business_hours=$1',[JSON.stringify(schedule('99:00','21:00'))]));
    await assert.rejects(db.query('update profiles set business_hours=$1',[JSON.stringify({...schedule(),timezone:'Bad/Zone'})]));
    await db.query('update profiles set business_hours=null');assert.equal((await db.query('select business_hours from profiles')).rows[0].business_hours,null);
  }finally{await db.close()}
});
