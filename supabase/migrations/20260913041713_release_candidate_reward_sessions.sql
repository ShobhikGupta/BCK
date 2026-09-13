-- Rehearse with BEGIN / ROLLBACK before applying. No existing data is deleted.
-- Deploy together with the new customer runtime: legacy coupon issuance fails closed.
create table public.bck_play_sessions (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique,
  merchant_id uuid not null references public.profiles(id),
  campaign_id uuid not null references public.campaigns(id),
  visitor_id text not null,
  game text not null,
  config jsonb not null,
  controls jsonb not null,
  outcome jsonb,
  result jsonb,
  response jsonb,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now()+interval '20 minutes',
  completed_at timestamptz
);
alter table public.bck_play_sessions enable row level security;
revoke all on public.bck_play_sessions from public,anon,authenticated;
create index bck_play_sessions_campaign_visitor on public.bck_play_sessions(campaign_id,visitor_id,created_at);
alter table public.coupons add column play_session_id uuid unique references public.bck_play_sessions(id);
alter table public.coupons add column valid_from timestamptz;
alter table public.coupons add column redeemed_by uuid;

create or replace function public.begin_bck_play(p_merchant_id uuid,p_campaign_id uuid,p_visitor_id text,p_game text,p_request_id uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare c campaigns%rowtype; s bck_play_sessions%rowtype; n integer; last_play timestamptz;
  cfg jsonb; item jsonb; outcome jsonb; total numeric:=0; pick numeric; w numeric; idx integer:=0;
begin
  if p_merchant_id is null or p_campaign_id is null or p_game is null or p_request_id is null or p_visitor_id is null or p_visitor_id !~ '^[A-Za-z0-9_-]{16,128}$' then
    return jsonb_build_object('ok',false,'reason','invalid_visitor'); end if;
  perform pg_advisory_xact_lock(hashtextextended(p_campaign_id::text||':'||p_visitor_id,0));
  select * into s from bck_play_sessions where request_id=p_request_id;
  if found then
    if s.visitor_id<>p_visitor_id or s.campaign_id<>p_campaign_id or s.merchant_id<>p_merchant_id or s.game<>p_game then
      return jsonb_build_object('ok',false,'reason','invalid_session'); end if;
    if s.expires_at<now() then return jsonb_build_object('ok',false,'reason','session_expired'); end if;
    return jsonb_build_object('ok',true,'session_id',s.id,'outcome',s.outcome);
  end if;
  select * into c from campaigns where id=p_campaign_id and merchant_id=p_merchant_id and status='active'
    and (start_date is null or start_date<=current_date) and (end_date is null or end_date>=current_date) for share;
  if not found or not exists(select 1 from profiles where id=p_merchant_id and onboarding_complete) then
    return jsonb_build_object('ok',false,'reason','campaign_not_active'); end if;
  if not coalesce(c.games ? p_game,false) or p_game not in ('Spin the Wheel','Instant Lottery','Slot Machine','Catch & Win','Snakes & Ladders','Tap Speed','Perfect Pour','Pin the Bite','Stack & Win') then
    return jsonb_build_object('ok',false,'reason','game_not_configured'); end if;
  select count(*),max(created_at) into n,last_play from activity_events where campaign_id=c.id and visitor_id=p_visitor_id and event_type='play';
  if c.max_plays_per_person>0 and n>=c.max_plays_per_person then return jsonb_build_object('ok',false,'reason','play_limit'); end if;
  if last_play is not null and now()<last_play+make_interval(mins=>c.cooldown_minutes) then return jsonb_build_object('ok',false,'reason','cooldown'); end if;
  cfg:=c.game_configs->p_game;
  if cfg is null then return jsonb_build_object('ok',false,'reason','game_not_configured'); end if;
  outcome:=jsonb_build_object('type','none');
  if p_game='Spin the Wheel' then
    for item in select value from jsonb_array_elements(cfg->'segments') loop total:=total+greatest(0,coalesce((item->>'weight')::numeric,0)); end loop;
    pick:=random()*total;
    for item in select value from jsonb_array_elements(cfg->'segments') loop
      w:=greatest(0,coalesce((item->>'weight')::numeric,0));pick:=pick-w;
      if pick<0 then outcome:=item||jsonb_build_object('index',idx);exit;end if;idx:=idx+1;
    end loop;
  elsif p_game='Instant Lottery' then
    total:=greatest(3,least(24,(cfg->>'totalCards')::integer));pick:=floor(random()*total);
    for item in select value from jsonb_array_elements(cfg->'prizes') loop
      pick:=pick-greatest(0,coalesce((item->>'cards')::integer,0));
      if pick<0 then outcome:=item;exit;end if;
    end loop;
  elsif p_game='Slot Machine' then
    pick:=random();
    if pick<0.18 then outcome:=(cfg->'three')||'{"matches":3}'::jsonb;
    elsif pick<0.55 then outcome:=(cfg->'two')||'{"matches":2}'::jsonb;
    else outcome:='{"type":"none","matches":0}'::jsonb;end if;
  else outcome:=null;
  end if;
  insert into bck_play_sessions(request_id,merchant_id,campaign_id,visitor_id,game,config,controls,outcome)
    values(p_request_id,p_merchant_id,p_campaign_id,p_visitor_id,p_game,cfg,coalesce(c.redemption_controls,'{}'),outcome) returning * into s;
  insert into activity_events(merchant_id,campaign_id,event_type,visitor_id,game,metadata)
    values(p_merchant_id,p_campaign_id,'play',p_visitor_id,p_game,jsonb_build_object('session_id',s.id));
  return jsonb_build_object('ok',true,'session_id',s.id,'outcome',s.outcome);
exception when invalid_text_representation or numeric_value_out_of_range then
  return jsonb_build_object('ok',false,'reason','invalid_configuration');
end $$;

create or replace function public.complete_bck_play(p_session_id uuid,p_visitor_id text,p_result jsonb)
returns jsonb language plpgsql security definer set search_path=public as $$
declare s bck_play_sessions%rowtype;c campaigns%rowtype;reward jsonb;score numeric;ceiling numeric;min_seconds numeric:=0;
  co coupons%rowtype;answer jsonb;hours integer;rtype text;eligible boolean:=true;
begin
  select * into s from bck_play_sessions where id=p_session_id and visitor_id=p_visitor_id for update;
  if not found then return jsonb_build_object('ok',false,'reason','invalid_session');end if;
  if s.completed_at is not null then return s.response;end if;
  if now()>s.expires_at then return jsonb_build_object('ok',false,'reason','session_expired');end if;
  select * into c from campaigns where id=s.campaign_id and merchant_id=s.merchant_id and status='active'
    and (start_date is null or start_date<=current_date) and (end_date is null or end_date>=current_date) for share;
  if not found or not (c.games ? s.game) then return jsonb_build_object('ok',false,'reason','campaign_not_active');end if;
  if jsonb_typeof(p_result) is distinct from 'object' or octet_length(p_result::text)>1024 then
    return jsonb_build_object('ok',false,'reason','invalid_result');end if;
  reward:=s.outcome;
  if s.game not in ('Spin the Wheel','Instant Lottery','Slot Machine') then
    if s.game='Snakes & Ladders' then
      if jsonb_typeof(p_result->'won') is distinct from 'boolean' or jsonb_typeof(p_result->'turns') is distinct from 'number' then
        return jsonb_build_object('ok',false,'reason','invalid_result');end if;
      score:=(p_result->>'turns')::numeric;ceiling:=500;min_seconds:=score*0.2;
      reward:=s.config->case when (p_result->>'won')::boolean then 'winner' else 'runner' end;
    else
      if jsonb_typeof(p_result->'score') is distinct from 'number' then return jsonb_build_object('ok',false,'reason','invalid_result');end if;
      score:=(p_result->>'score')::numeric;
      if s.game='Perfect Pour' then
        ceiling:=100;min_seconds:=0.1;
        if jsonb_typeof(p_result->'overflow') is distinct from 'boolean' then return jsonb_build_object('ok',false,'reason','invalid_result');end if;
        eligible:=not (p_result->>'overflow')::boolean;
      elsif s.game='Pin the Bite' then ceiling:=case s.config->>'difficulty' when 'Easy' then 5 when 'Hard' then 9 else 7 end;min_seconds:=score*0.12;
      elsif s.game='Stack & Win' then ceiling:=20;min_seconds:=score*0.12;
        if jsonb_typeof(p_result->'perfect') is distinct from 'number' or (p_result->>'perfect')::numeric not between 0 and score or (p_result->>'perfect')::numeric<>trunc((p_result->>'perfect')::numeric) then
          return jsonb_build_object('ok',false,'reason','invalid_result');end if;
      elsif s.game='Tap Speed' then ceiling:=least(15,greatest(5,(s.config->>'duration')::numeric))*25;min_seconds:=least(15,greatest(5,(s.config->>'duration')::numeric));
      elsif s.game='Catch & Win' then ceiling:=4000;min_seconds:=20;
      else return jsonb_build_object('ok',false,'reason','invalid_game');end if;
      select value into reward from jsonb_array_elements(s.config->'tiers') where
        case when s.game='Pin the Bite' then ceil(least(7,greatest(0,(value->>'min')::numeric))*ceiling/7)
        when s.game='Tap Speed' then least(ceil(greatest(0,(value->>'min')::numeric)*
          case s.config->>'difficulty' when 'Easy' then 0.75 when 'Hard' then 1.15 else 1 end),min_seconds*10)
        else greatest(0,(value->>'min')::numeric) end<=score
        order by (value->>'min')::numeric desc limit 1;
    end if;
    if score is null or score<0 or score>ceiling or score<>trunc(score) or extract(epoch from now()-s.created_at)<min_seconds then
      return jsonb_build_object('ok',false,'reason','invalid_result');end if;
  end if;
  if not eligible or reward is null or coalesce(reward->>'type','none')='none' or length(trim(coalesce(reward->>'label','')))=0 then
    answer:=jsonb_build_object('ok',true,'won',false);
  else
    rtype:=case when reward->>'type'='comeback' then 'comeback' else 'instant' end;
    hours:=least(8760,greatest(1,coalesce((s.controls->>'expiryHours')::integer,case when rtype='comeback' then 168 else 24 end)));
    insert into coupons(merchant_id,campaign_id,visitor_id,game,reward_label,code,reward_type,expires_at,valid_from,play_session_id)
      values(s.merchant_id,s.campaign_id,s.visitor_id,s.game,left(reward->>'label',200),
      upper(left(regexp_replace(coalesce(nullif(reward->>'code',''),'BCK'),'[^A-Za-z0-9]','','g'),12))||'-'||upper(replace(gen_random_uuid()::text,'-','')),
      rtype,case when coalesce((s.controls->>'couponAutoExpiry')::boolean,true) then now()+make_interval(hours=>hours)+case when rtype='comeback' then interval '24 hours' else interval '0 hours' end else null end,
      case when rtype='comeback' then now()+interval '24 hours' else now() end,s.id) returning * into co;
    insert into activity_events(merchant_id,campaign_id,event_type,visitor_id,game,reward_label,coupon_code,metadata)
      values(s.merchant_id,s.campaign_id,'win',s.visitor_id,s.game,co.reward_label,co.code,jsonb_build_object('session_id',s.id));
    answer:=jsonb_build_object('ok',true,'won',true,'coupon',to_jsonb(co));
  end if;
  update bck_play_sessions set completed_at=now(),result=p_result,response=answer where id=s.id;
  update activity_events set metadata=metadata||jsonb_build_object('completed',true,'result',p_result)
    where event_type='play' and metadata->>'session_id'=s.id::text;
  return answer;
exception when invalid_text_representation or numeric_value_out_of_range then
  return jsonb_build_object('ok',false,'reason','invalid_result');
end $$;

-- Every coupon update, including old merchant clients, obeys expiry and single use.
create or replace function public.log_coupon_redemption() returns trigger
language plpgsql security definer set search_path=public as $$
begin
  if old.status='redeemed' and new is distinct from old then raise exception 'Coupon already redeemed';end if;
  if new.status='redeemed' and old.status<>'redeemed' then
    if old.status<>'issued' or (old.expires_at is not null and old.expires_at<=now()) then raise exception 'Coupon expired';end if;
    if old.valid_from is not null and old.valid_from>now() then raise exception 'Reward valid on a later visit';end if;
    new.redeemed_at:=now();new.redeemed_by:=auth.uid();
    insert into activity_events(merchant_id,campaign_id,event_type,visitor_id,game,reward_label,coupon_code,metadata)
      values(old.merchant_id,old.campaign_id,'redeem',old.visitor_id,old.game,old.reward_label,old.code,jsonb_build_object('redeemed_by',auth.uid()));
  end if;return new;
end $$;
create or replace function public.redeem_bck_coupon(p_code text) returns jsonb
language plpgsql security definer set search_path=public as $$
declare c coupons%rowtype;
begin
  if auth.uid() is null then return jsonb_build_object('ok',false,'reason','unauthorized');end if;
  select * into c from coupons where code=upper(trim(p_code)) and merchant_id=auth.uid() for update;
  if not found then return jsonb_build_object('ok',false,'reason','not_found');end if;
  if c.status<>'issued' then return jsonb_build_object('ok',false,'reason',c.status);end if;
  if c.expires_at<=now() then return jsonb_build_object('ok',false,'reason','expired');end if;
  if c.valid_from>now() then return jsonb_build_object('ok',false,'reason','not_yet_valid');end if;
  update coupons set status='redeemed' where id=c.id returning * into c;
  return jsonb_build_object('ok',true,'redeemed_at',c.redeemed_at);
end $$;
create or replace function public.redeem_public_coupon(p_coupon_id uuid,p_visitor_id text) returns jsonb
language plpgsql security definer set search_path=public as $$
declare c coupons%rowtype;controls jsonb;
begin
  select * into c from coupons where id=p_coupon_id and visitor_id=p_visitor_id for update;
  if not found then return jsonb_build_object('ok',false,'reason','not_found');end if;
  select redemption_controls into controls from campaigns where id=c.campaign_id;
  if coalesce(controls->>'mode','manual')<>'automatic' then return jsonb_build_object('ok',false,'reason','dashboard_redemption_only');end if;
  if c.status<>'issued' then return jsonb_build_object('ok',false,'reason',c.status);end if;
  if c.expires_at<=now() then return jsonb_build_object('ok',false,'reason','expired');end if;
  if c.valid_from>now() then return jsonb_build_object('ok',false,'reason','not_yet_valid');end if;
  update coupons set status='redeemed' where id=c.id;
  return jsonb_build_object('ok',true);
end $$;
revoke all on function public.begin_bck_play(uuid,uuid,text,text,uuid) from public;
revoke all on function public.complete_bck_play(uuid,text,jsonb) from public;
revoke all on function public.redeem_bck_coupon(text) from public,anon;
revoke all on function public.log_coupon_redemption() from public,anon,authenticated;
grant execute on function public.begin_bck_play(uuid,uuid,text,text,uuid),public.complete_bck_play(uuid,text,jsonb) to anon,authenticated;
grant execute on function public.redeem_bck_coupon(text) to authenticated;
-- Close the arbitrary-reward endpoint; no bypass remains through legacy clients.
revoke all on function public.issue_public_coupon(uuid,uuid,text,text,text,text,text,integer) from public,anon,authenticated;
revoke all on function public.start_public_play(uuid,uuid,text,text) from public,anon,authenticated;
