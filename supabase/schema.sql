-- KANTHA PRANTH — Bengaluru V1 database
-- Run this in Supabase Dashboard → SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.localities (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  city text not null default 'Bengaluru',
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  locality_id uuid references public.localities(id),
  avatar_url text,
  bio text,
  is_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Sensitive registration details are stored separately and are never publicly readable.
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

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  locality_id uuid references public.localities(id),
  type text not null default 'Discussion',
  title text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete set null,
  name text not null,
  category text not null,
  description text,
  locality_id uuid references public.localities(id),
  phone text,
  website text,
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles(id) on delete cascade,
  locality_id uuid references public.localities(id),
  title text not null,
  description text,
  price numeric(12,2) not null,
  category text not null default 'Other',
  condition text,
  image_url text,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid references public.profiles(id) on delete set null,
  locality_id uuid references public.localities(id),
  title text not null,
  description text,
  starts_at timestamptz not null,
  location text,
  created_at timestamptz not null default now()
);

create table if not exists public.event_registrations (
  event_id uuid references public.events(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

insert into public.localities (name) values
('Nagarbhavi'),('Chandra Layout'),('Vijayanagar'),('Rajajinagar'),('Jayanagar'),
('Basavanagudi'),('Malleshwaram'),('Indiranagar'),('Yelahanka'),('Whitefield')
on conflict (name) do nothing;

-- Enable Row Level Security on every public app table.
alter table public.localities enable row level security;
alter table public.profiles enable row level security;
alter table public.profile_private enable row level security;
alter table public.posts enable row level security;
alter table public.businesses enable row level security;
alter table public.listings enable row level security;
alter table public.events enable row level security;
alter table public.event_registrations enable row level security;

-- Public browsing policies for community discovery.
drop policy if exists "localities are readable" on public.localities;
create policy "localities are readable" on public.localities for select to anon, authenticated using (true);

drop policy if exists "profiles are readable" on public.profiles;
create policy "profiles are readable" on public.profiles for select to anon, authenticated using (true);

drop policy if exists "posts are readable" on public.posts;
create policy "posts are readable" on public.posts for select to anon, authenticated using (true);

drop policy if exists "businesses are readable" on public.businesses;
create policy "businesses are readable" on public.businesses for select to anon, authenticated using (true);

drop policy if exists "listings are readable" on public.listings;
create policy "listings are readable" on public.listings for select to anon, authenticated using (true);

drop policy if exists "events are readable" on public.events;
create policy "events are readable" on public.events for select to anon, authenticated using (true);

-- Signed-in users can create/update only their own content.
drop policy if exists "members read their own private profile" on public.profile_private;
create policy "members read their own private profile"
  on public.profile_private for select to authenticated using ((select auth.uid()) = id);

drop policy if exists "members create their own private profile" on public.profile_private;
create policy "members create their own private profile"
  on public.profile_private for insert to authenticated with check ((select auth.uid()) = id);

drop policy if exists "members update their own private profile" on public.profile_private;
create policy "members update their own private profile"
  on public.profile_private for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

drop policy if exists "admins manage private profiles" on public.profile_private;
create policy "admins manage private profiles"
  on public.profile_private for all to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "users create own profile" on public.profiles;
create policy "users create own profile" on public.profiles for insert to authenticated with check ((select auth.uid()) = id);

drop policy if exists "users update own profile" on public.profiles;
create policy "users update own profile" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

drop policy if exists "users create posts" on public.posts;
create policy "users create posts" on public.posts for insert to authenticated with check ((select auth.uid()) = author_id);

drop policy if exists "users update own posts" on public.posts;
create policy "users update own posts" on public.posts for update to authenticated using ((select auth.uid()) = author_id) with check ((select auth.uid()) = author_id);

drop policy if exists "users delete own posts" on public.posts;
create policy "users delete own posts" on public.posts for delete to authenticated using ((select auth.uid()) = author_id);

drop policy if exists "users create listings" on public.listings;
create policy "users create listings" on public.listings for insert to authenticated with check ((select auth.uid()) = seller_id);

drop policy if exists "users update own listings" on public.listings;
create policy "users update own listings" on public.listings for update to authenticated using ((select auth.uid()) = seller_id) with check ((select auth.uid()) = seller_id);

drop policy if exists "users delete own listings" on public.listings;
create policy "users delete own listings" on public.listings for delete to authenticated using ((select auth.uid()) = seller_id);

drop policy if exists "users register events" on public.event_registrations;
create policy "users register events" on public.event_registrations for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "users view own registrations" on public.event_registrations;
create policy "users view own registrations" on public.event_registrations for select to authenticated using ((select auth.uid()) = user_id);


-- Family Directory
create table if not exists public.families (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  family_name text not null,
  locality_id uuid references public.localities(id),
  visibility text not null default 'community' check (visibility in ('community','private')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.family_members (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  member_name text not null,
  relationship text not null default 'Family member',
  created_at timestamptz not null default now()
);

alter table public.families enable row level security;
alter table public.family_members enable row level security;

drop policy if exists "community members can view visible families" on public.families;
create policy "community members can view visible families" on public.families
for select to authenticated
using (visibility = 'community' or (select auth.uid()) = owner_id);

drop policy if exists "users create own family" on public.families;
create policy "users create own family" on public.families
for insert to authenticated
with check ((select auth.uid()) = owner_id);

drop policy if exists "users update own family" on public.families;
create policy "users update own family" on public.families
for update to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

drop policy if exists "users delete own family" on public.families;
create policy "users delete own family" on public.families
for delete to authenticated
using ((select auth.uid()) = owner_id);

drop policy if exists "members visible with family" on public.family_members;
create policy "members visible with family" on public.family_members
for select to authenticated
using (exists (
  select 1 from public.families f
  where f.id = family_id
  and (f.visibility = 'community' or f.owner_id = (select auth.uid()))
));

drop policy if exists "family owners add members" on public.family_members;
create policy "family owners add members" on public.family_members
for insert to authenticated
with check (exists (
  select 1 from public.families f
  where f.id = family_id and f.owner_id = (select auth.uid())
));

drop policy if exists "family owners update members" on public.family_members;
create policy "family owners update members" on public.family_members
for update to authenticated
using (exists (
  select 1 from public.families f
  where f.id = family_id and f.owner_id = (select auth.uid())
))
with check (exists (
  select 1 from public.families f
  where f.id = family_id and f.owner_id = (select auth.uid())
));

drop policy if exists "family owners delete members" on public.family_members;
create policy "family owners delete members" on public.family_members
for delete to authenticated
using (exists (
  select 1 from public.families f
  where f.id = family_id and f.owner_id = (select auth.uid())
));
