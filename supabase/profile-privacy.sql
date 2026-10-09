-- KANTHA PRANTH — protect private registration details
-- Run after the base schema and any legacy registration-profile.sql migration.
-- This migration preserves existing member data, moves it to a restricted table,
-- then removes sensitive columns from the community-readable profiles table.

create table if not exists public.profile_private (
  id uuid primary key references public.profiles(id) on delete cascade,
  phone text,
  mobile_number text,
  date_of_birth date,
  marital_status text,
  blood_group text,
  occupation text,
  highest_education text,
  parents_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $migration$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'phone'
  ) and exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'parents_name'
  ) then
    execute $copy$
      insert into public.profile_private
        (id, phone, mobile_number, date_of_birth, marital_status, blood_group, occupation, highest_education, parents_name, created_at, updated_at)
      select
        id, phone, mobile_number, date_of_birth, marital_status, blood_group, occupation, highest_education, parents_name, created_at, updated_at
      from public.profiles
      on conflict (id) do update set
        phone = excluded.phone,
        mobile_number = excluded.mobile_number,
        date_of_birth = excluded.date_of_birth,
        marital_status = excluded.marital_status,
        blood_group = excluded.blood_group,
        occupation = excluded.occupation,
        highest_education = excluded.highest_education,
        parents_name = excluded.parents_name,
        updated_at = now()
    $copy$;
  end if;
end
$migration$;

alter table public.profile_private enable row level security;

drop policy if exists "members read their own private profile" on public.profile_private;
create policy "members read their own private profile"
  on public.profile_private for select to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "members create their own private profile" on public.profile_private;
create policy "members create their own private profile"
  on public.profile_private for insert to authenticated
  with check ((select auth.uid()) = id);

drop policy if exists "members update their own private profile" on public.profile_private;
create policy "members update their own private profile"
  on public.profile_private for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

drop policy if exists "admins manage private profiles" on public.profile_private;
create policy "admins manage private profiles"
  on public.profile_private for all to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- These fields are no longer exposed through the broadly readable profiles table.
alter table public.profiles drop column if exists phone;
alter table public.profiles drop column if exists mobile_number;
alter table public.profiles drop column if exists date_of_birth;
alter table public.profiles drop column if exists marital_status;
alter table public.profiles drop column if exists blood_group;
alter table public.profiles drop column if exists occupation;
alter table public.profiles drop column if exists highest_education;
alter table public.profiles drop column if exists parents_name;

create index if not exists profile_private_updated_at_idx
  on public.profile_private(updated_at desc);
