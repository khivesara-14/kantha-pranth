-- KANTHA PRANTH — Admin RLS policies
-- Run this once in Supabase Dashboard → SQL Editor.
-- The admin role is read from auth.users.raw_app_meta_data via auth.jwt().
-- Never put a Supabase service-role key in the browser.

-- Allow administrators to verify/unverify any community profile.
drop policy if exists "admins manage profiles" on public.profiles;
create policy "admins manage profiles"
on public.profiles
for update
to authenticated
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Allow administrators to remove a profile if/when the admin UI supports it.
drop policy if exists "admins delete profiles" on public.profiles;
create policy "admins delete profiles"
on public.profiles
for delete
to authenticated
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
