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


-- Allow administrators to remove community posts during moderation.
drop policy if exists "admins delete posts" on public.posts;
create policy "admins delete posts"
on public.posts
for delete
to authenticated
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Allow administrators to edit posts if moderation tools need it later.
drop policy if exists "admins manage posts" on public.posts;
create policy "admins manage posts"
on public.posts
for update
to authenticated
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
