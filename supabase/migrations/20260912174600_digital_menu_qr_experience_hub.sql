-- BCK Digital Menu + Permanent QR Experience Hub
-- Applied additively to the existing BCK schema. Safe to re-run where IF EXISTS/IF NOT EXISTS is used.

alter table public.profiles add column if not exists qr_experience_mode text not null default 'smart';
alter table public.profiles drop constraint if exists profiles_qr_experience_mode_check;
alter table public.profiles add constraint profiles_qr_experience_mode_check check (qr_experience_mode in ('smart','menu_first','game_first'));

create table if not exists public.menu_categories (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 80),
  position integer not null default 0 check (position >= 0),
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.profiles(id) on delete cascade,
  category_id uuid not null references public.menu_categories(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 120),
  description text,
  price numeric(10,2) not null check (price >= 0),
  offer_price numeric(10,2) check (offer_price is null or offer_price >= 0),
  image_url text,
  dietary_type text check (dietary_type is null or dietary_type in ('veg','non_veg','egg','na')),
  is_featured boolean not null default false,
  is_available boolean not null default true,
  is_visible boolean not null default true,
  position integer not null default 0 check (position >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists menu_categories_merchant_position_idx on public.menu_categories(merchant_id, position, created_at);
create index if not exists menu_items_merchant_category_position_idx on public.menu_items(merchant_id, category_id, position, created_at);
create index if not exists menu_items_public_idx on public.menu_items(merchant_id, is_visible, is_available);

alter table public.menu_categories enable row level security;
alter table public.menu_items enable row level security;
revoke all on public.menu_categories from anon;
revoke all on public.menu_items from anon;
grant select, insert, update, delete on public.menu_categories to authenticated;
grant select, insert, update, delete on public.menu_items to authenticated;

drop policy if exists menu_categories_select_own on public.menu_categories;
create policy menu_categories_select_own on public.menu_categories for select to authenticated using ((select auth.uid()) = merchant_id);
drop policy if exists menu_categories_insert_own on public.menu_categories;
create policy menu_categories_insert_own on public.menu_categories for insert to authenticated with check ((select auth.uid()) = merchant_id);
drop policy if exists menu_categories_update_own on public.menu_categories;
create policy menu_categories_update_own on public.menu_categories for update to authenticated using ((select auth.uid()) = merchant_id) with check ((select auth.uid()) = merchant_id);
drop policy if exists menu_categories_delete_own on public.menu_categories;
create policy menu_categories_delete_own on public.menu_categories for delete to authenticated using ((select auth.uid()) = merchant_id);

drop policy if exists menu_items_select_own on public.menu_items;
create policy menu_items_select_own on public.menu_items for select to authenticated using ((select auth.uid()) = merchant_id);
drop policy if exists menu_items_insert_own on public.menu_items;
create policy menu_items_insert_own on public.menu_items for insert to authenticated with check (
  (select auth.uid()) = merchant_id and exists (select 1 from public.menu_categories c where c.id = category_id and c.merchant_id = (select auth.uid()))
);
drop policy if exists menu_items_update_own on public.menu_items;
create policy menu_items_update_own on public.menu_items for update to authenticated using ((select auth.uid()) = merchant_id) with check (
  (select auth.uid()) = merchant_id and exists (select 1 from public.menu_categories c where c.id = category_id and c.merchant_id = (select auth.uid()))
);
drop policy if exists menu_items_delete_own on public.menu_items;
create policy menu_items_delete_own on public.menu_items for delete to authenticated using ((select auth.uid()) = merchant_id);

create or replace function public.touch_menu_updated_at() returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;
drop trigger if exists menu_categories_touch_updated_at on public.menu_categories;
create trigger menu_categories_touch_updated_at before update on public.menu_categories for each row execute function public.touch_menu_updated_at();
drop trigger if exists menu_items_touch_updated_at on public.menu_items;
create trigger menu_items_touch_updated_at before update on public.menu_items for each row execute function public.touch_menu_updated_at();
alter function public.touch_campaign_updated_at() set search_path = public;

alter table public.coupons add column if not exists menu_item_id uuid references public.menu_items(id) on delete set null;
alter table public.coupons add column if not exists menu_category_id uuid references public.menu_categories(id) on delete set null;

create or replace function public.get_public_experience(p_merchant_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_profile public.profiles%rowtype;
  v_campaign public.campaigns%rowtype;
  v_categories jsonb := '[]'::jsonb;
  v_structured_menu_exists boolean := false;
  v_legacy_menu_url text;
begin
  select * into v_profile from public.profiles where id=p_merchant_id and onboarding_complete=true;
  if not found then return null; end if;
  select * into v_campaign from public.campaigns c where c.merchant_id=p_merchant_id and c.status='active'
    and (c.start_date is null or c.start_date<=current_date) and (c.end_date is null or c.end_date>=current_date)
    order by c.updated_at desc limit 1;
  select coalesce(jsonb_agg(cat_payload order by cat_position,cat_created),'[]'::jsonb) into v_categories from (
    select c.position cat_position,c.created_at cat_created,
      jsonb_build_object('name',c.name,'position',c.position,'items',coalesce((
        select jsonb_agg(jsonb_build_object(
          'name',i.name,'description',i.description,'price',i.price,'offer_price',i.offer_price,'image_url',i.image_url,
          'dietary_type',i.dietary_type,'is_featured',i.is_featured,'is_available',i.is_available,'position',i.position
        ) order by i.position,i.created_at)
        from public.menu_items i where i.category_id=c.id and i.merchant_id=p_merchant_id and i.is_visible=true
      ),'[]'::jsonb)) cat_payload
    from public.menu_categories c where c.merchant_id=p_merchant_id and c.is_visible=true
      and exists(select 1 from public.menu_items i where i.category_id=c.id and i.merchant_id=p_merchant_id and i.is_visible=true)
  ) q;
  v_structured_menu_exists := jsonb_array_length(v_categories)>0;
  v_legacy_menu_url := coalesce(v_profile.menu_asset_url,v_profile.menu_url);
  return jsonb_build_object(
    'merchant',jsonb_build_object(
      'business_name',coalesce(v_profile.business_name,'BCK merchant'),'business_description',v_profile.business_description,
      'logo_url',v_profile.logo_url,'customer_welcome_message',coalesce(v_profile.customer_welcome_message,'A quick game. A real reward. Ready?'),
      'landing_cta_text',coalesce(v_profile.landing_cta_text,'Play & win'),'preferred_language',coalesce(v_profile.preferred_language,'en'),
      'qr_experience_mode',coalesce(v_profile.qr_experience_mode,'smart'),'fallback_message',v_profile.fallback_message,'fallback_url',v_profile.fallback_url),
    'menu',jsonb_build_object('exists',v_structured_menu_exists,'structured_exists',v_structured_menu_exists,'categories',v_categories,'legacy_url',v_legacy_menu_url),
    'campaign',case when v_campaign.id is null then null else jsonb_build_object(
      'id',v_campaign.id,'name',v_campaign.name,'description',v_campaign.description,'games',v_campaign.games,'reward_mode',v_campaign.reward_mode,
      'game_configs',v_campaign.game_configs,'game_probabilities',v_campaign.game_probabilities,'redemption_controls',v_campaign.redemption_controls,
      'max_plays_per_person',v_campaign.max_plays_per_person,'cooldown_minutes',v_campaign.cooldown_minutes,'start_date',v_campaign.start_date,'end_date',v_campaign.end_date) end
  );
end; $$;
revoke all on function public.get_public_experience(uuid) from public;
grant execute on function public.get_public_experience(uuid) to anon,authenticated;

create or replace function public.record_public_scan(p_merchant_id uuid,p_visitor_id text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_campaign public.campaigns%rowtype; v_had_prior boolean; v_return_today boolean; v_track boolean := true;
begin
  if not exists(select 1 from public.profiles where id=p_merchant_id and onboarding_complete=true) then return jsonb_build_object('ok',false,'reason','merchant_unavailable'); end if;
  select * into v_campaign from public.campaigns where merchant_id=p_merchant_id and status='active'
    and (start_date is null or start_date<=current_date) and (end_date is null or end_date>=current_date) order by updated_at desc limit 1;
  if found then v_track:=coalesce((v_campaign.redemption_controls->>'trackRepeat')::boolean,true); end if;
  select exists(select 1 from public.activity_events where merchant_id=p_merchant_id and visitor_id=p_visitor_id and event_type='scan' and created_at<date_trunc('day',now())) into v_had_prior;
  select exists(select 1 from public.activity_events where merchant_id=p_merchant_id and visitor_id=p_visitor_id and event_type='return' and created_at>=date_trunc('day',now())) into v_return_today;
  insert into public.activity_events(merchant_id,campaign_id,event_type,visitor_id) values(p_merchant_id,case when v_campaign.id is null then null else v_campaign.id end,'scan',p_visitor_id);
  if v_track and v_had_prior and not v_return_today then insert into public.activity_events(merchant_id,campaign_id,event_type,visitor_id) values(p_merchant_id,case when v_campaign.id is null then null else v_campaign.id end,'return',p_visitor_id); end if;
  return jsonb_build_object('ok',true,'campaign_id',case when v_campaign.id is null then null else v_campaign.id end,'returned',v_track and v_had_prior and not v_return_today);
end; $$;
revoke all on function public.record_public_scan(uuid,text) from public;
grant execute on function public.record_public_scan(uuid,text) to anon,authenticated;
