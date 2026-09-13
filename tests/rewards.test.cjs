const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {PGlite}=require('@electric-sql/pglite');
test('session rewards reject forgery and replay; redemption is single use',async()=>{
  const db=new PGlite();
  try{
    await db.exec(`
      create role anon;create role authenticated;create schema auth;
      create function auth.uid() returns uuid language sql as $$select nullif(current_setting('request.user_id',true),'')::uuid$$;
      create table profiles(id uuid primary key default gen_random_uuid(),onboarding_complete boolean default true);
      create table campaigns(id uuid primary key default gen_random_uuid(),merchant_id uuid references profiles(id),status text default 'active',start_date date,end_date date,games jsonb,game_configs jsonb,redemption_controls jsonb default '{}',max_plays_per_person integer default 1,cooldown_minutes integer default 0);
      create table activity_events(id uuid primary key default gen_random_uuid(),merchant_id uuid,campaign_id uuid,event_type text,visitor_id text,game text,reward_label text,coupon_code text,metadata jsonb default '{}',created_at timestamptz default now());
      create table coupons(id uuid primary key default gen_random_uuid(),merchant_id uuid,campaign_id uuid,visitor_id text,game text,reward_label text,code text unique,reward_type text,status text default 'issued',issued_at timestamptz default now(),expires_at timestamptz,redeemed_at timestamptz);
      create function issue_public_coupon(uuid,uuid,text,text,text,text,text,integer) returns jsonb language sql as $$select '{}'::jsonb$$;
      create function start_public_play(uuid,uuid,text,text) returns jsonb language sql as $$select '{}'::jsonb$$;
    `);
    await db.exec(readFileSync('supabase/migrations/20260913041713_release_candidate_reward_sessions.sql','utf8'));
    await db.exec('create trigger coupon_redemption before update on coupons for each row execute function log_coupon_redemption()');
    const merchant=(await db.query('insert into profiles default values returning id')).rows[0].id;
    const config={'Spin the Wheel':{segments:[{label:'Configured reward',code:'SAFE',type:'instant',weight:100}]},'Perfect Pour':{tiers:[{min:90,label:'Pour reward',type:'instant',code:'POUR'}]}};
    const campaign=(await db.query('insert into campaigns(merchant_id,games,game_configs) values($1,$2,$3) returning id',[merchant,JSON.stringify(Object.keys(config)),JSON.stringify(config)])).rows[0].id;
    const visitor='test-visitor-000001',request=crypto.randomUUID();
    const begin=async(game='Spin the Wheel',v=visitor,r=request)=>(await db.query('select begin_bck_play($1,$2,$3,$4,$5) value',[merchant,campaign,v,game,r])).rows[0].value;
    const complete=async(id,result={},v=visitor)=>(await db.query('select complete_bck_play($1,$2,$3) value',[id,v,JSON.stringify(result)])).rows[0].value;
    const started=await begin();assert.equal(started.ok,true);assert.equal(started.outcome.label,'Configured reward');
    assert.equal((await begin()).session_id,started.session_id);
    assert.equal((await begin('Spin the Wheel',visitor,crypto.randomUUID())).reason,'play_limit');
    assert.equal((await begin('Unknown','test-visitor-000002',crypto.randomUUID())).reason,'game_not_configured');
    assert.equal((await complete(started.session_id,{},'another-visitor-0001')).reason,'invalid_session');
    const reward=await complete(started.session_id,{label:'FREE EVERYTHING',reward_type:'comeback'});
    assert.equal(reward.coupon.reward_label,'Configured reward');assert.equal(reward.coupon.reward_type,'instant');
    assert.deepEqual(await complete(started.session_id),reward);
    assert.equal((await db.query('select count(*)::int n from coupons')).rows[0].n,1);
    const skill=await begin('Perfect Pour','test-visitor-000003',crypto.randomUUID());
    assert.equal((await complete(skill.session_id,{score:101,overflow:false},'test-visitor-000003')).reason,'invalid_result');
    await db.query("update bck_play_sessions set created_at=now()-interval '1 second' where id=$1",[skill.session_id]);
    assert.equal((await complete(skill.session_id,{score:99,overflow:true},'test-visitor-000003')).won,false);
    assert.equal((await db.query('select redeem_bck_coupon($1) value',[reward.coupon.code])).rows[0].value.reason,'unauthorized');
    await db.query("select set_config('request.user_id',$1,false)",[merchant]);
    assert.equal((await db.query('select redeem_bck_coupon($1) value',[reward.coupon.code])).rows[0].value.ok,true);
    assert.equal((await db.query('select redeem_bck_coupon($1) value',[reward.coupon.code])).rows[0].value.reason,'redeemed');
    assert.equal((await db.query("select count(*)::int n from activity_events where event_type='redeem'")).rows[0].n,1);
    const privileges=(await db.query("select has_function_privilege('anon','issue_public_coupon(uuid,uuid,text,text,text,text,text,integer)','execute') old,has_table_privilege('anon','bck_play_sessions','select') sessions")).rows[0];
    assert.equal(privileges.old,false);assert.equal(privileges.sessions,false);
  }finally{await db.close()}
});
