-- Kantha Pranth: real community business directory
-- Run in Supabase SQL Editor after schema.sql.

create index if not exists businesses_locality_category_idx
  on public.businesses(locality_id, category);
create index if not exists businesses_owner_created_idx
  on public.businesses(owner_id, created_at desc);

drop policy if exists "business owners create their listings" on public.businesses;
create policy "business owners create their listings"
  on public.businesses for insert to authenticated
  with check (owner_id = (select auth.uid()) and verified = false);

drop policy if exists "business owners update their listings" on public.businesses;
create policy "business owners update their listings"
  on public.businesses for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

drop policy if exists "business owners delete their listings" on public.businesses;
create policy "business owners delete their listings"
  on public.businesses for delete to authenticated
  using (owner_id = (select auth.uid()));

drop policy if exists "admins manage businesses" on public.businesses;
create policy "admins manage businesses"
  on public.businesses for all to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create or replace function public.prevent_business_verification_self_change()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if (auth.jwt() -> 'app_metadata' ->> 'role') is distinct from 'admin' then
    if tg_op = 'INSERT' and new.verified then
      raise exception 'Only an administrator can verify a business';
    end if;
    if tg_op = 'UPDATE' and new.verified is distinct from old.verified then
      raise exception 'Only an administrator can change business verification';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists businesses_protect_verification on public.businesses;
create trigger businesses_protect_verification
before insert or update on public.businesses
for each row execute function public.prevent_business_verification_self_change();
