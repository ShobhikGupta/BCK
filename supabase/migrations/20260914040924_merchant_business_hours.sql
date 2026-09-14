-- Additive only. DO NOT apply to the shared project without explicit approval.
create or replace function public.bck_valid_business_hours(value jsonb)
returns boolean language plpgsql stable set search_path=pg_catalog as $$
declare d jsonb;
begin
  if value is null then return true;end if;
  if jsonb_typeof(value) is distinct from 'object' or jsonb_typeof(value->'days') is distinct from 'array'
    or jsonb_array_length(value->'days')<>7 or not exists(select 1 from pg_timezone_names where name=value->>'timezone') then return false;end if;
  for d in select * from jsonb_array_elements(value->'days') loop
    if jsonb_typeof(d->'open') is distinct from 'boolean' then return false;end if;
    if (d->>'open')::boolean and (coalesce(d->>'start','')!~'^([01][0-9]|2[0-3]):[0-5][0-9]$'
      or coalesce(d->>'end','')!~'^([01][0-9]|2[0-3]):[0-5][0-9]$' or d->>'start'=d->>'end') then return false;end if;
  end loop;
  return octet_length(value::text)<=4096;
exception when others then return false;
end;
$$;
alter table public.profiles add column if not exists business_hours jsonb;
alter table public.profiles add constraint profiles_business_hours_valid check(public.bck_valid_business_hours(business_hours));
comment on column public.profiles.business_hours is 'Optional IANA timezone and Monday-first seven-day open/closed schedule. Overnight close supported.';
