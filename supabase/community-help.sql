-- Kantha Pranth: moderated community help board
-- Run in Supabase SQL Editor after the base schema.

create table if not exists public.help_requests (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.profiles(id) on delete cascade,
  locality_id uuid references public.localities(id) on delete set null,
  category text not null check (category in ('Blood requirement','Lost & found','Volunteer','Support request','Other')),
  title text not null check (char_length(trim(title)) between 4 and 120),
  description text not null check (char_length(trim(description)) between 10 and 2500),
  status text not null default 'open' check (status in ('open','resolved','moderated')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists help_requests_locality_status_created_idx
  on public.help_requests(locality_id, status, created_at desc);
create index if not exists help_requests_created_by_idx
  on public.help_requests(created_by, created_at desc);

alter table public.help_requests enable row level security;

drop policy if exists "signed in members can read community help" on public.help_requests;
create policy "signed in members can read community help"
  on public.help_requests for select to authenticated using (true);

drop policy if exists "members create their own help requests" on public.help_requests;
create policy "members create their own help requests"
  on public.help_requests for insert to authenticated
  with check ((select auth.uid()) = created_by);

drop policy if exists "members update their own help requests" on public.help_requests;
create policy "members update their own help requests"
  on public.help_requests for update to authenticated
  using ((select auth.uid()) = created_by)
  with check ((select auth.uid()) = created_by);

drop policy if exists "members delete their own help requests" on public.help_requests;
create policy "members delete their own help requests"
  on public.help_requests for delete to authenticated
  using ((select auth.uid()) = created_by);
