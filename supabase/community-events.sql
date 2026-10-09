-- Kantha Pranth: verified-member events and event registrations
-- Run in Supabase SQL Editor after schema.sql.

create index if not exists events_starts_at_idx on public.events(starts_at);
create index if not exists event_registrations_user_created_idx on public.event_registrations(user_id, created_at desc);

drop policy if exists "verified members create events" on public.events;
create policy "verified members create events"
  on public.events for insert to authenticated
  with check (
    organizer_id = (select auth.uid())
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.is_verified = true
    )
  );

drop policy if exists "organizers update their events" on public.events;
create policy "organizers update their events"
  on public.events for update to authenticated
  using (
    organizer_id = (select auth.uid())
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.is_verified = true
    )
  )
  with check (organizer_id = (select auth.uid()));

drop policy if exists "organizers delete their events" on public.events;
create policy "organizers delete their events"
  on public.events for delete to authenticated
  using (organizer_id = (select auth.uid()));

drop policy if exists "members can cancel their own event registrations" on public.event_registrations;
create policy "members can cancel their own event registrations"
  on public.event_registrations for delete to authenticated
  using ((select auth.uid()) = user_id);
