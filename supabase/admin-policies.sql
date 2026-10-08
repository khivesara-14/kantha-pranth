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

-- FULL COMMUNITY ADMIN CONTROL
-- Administrators can read, create, edit and delete community content.
-- These policies are additive to normal member policies.

drop policy if exists "admins full control profiles" on public.profiles;
create policy "admins full control profiles"
on public.profiles for all to authenticated
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "admins full control posts" on public.posts;
create policy "admins full control posts"
on public.posts for all to authenticated
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "admins full control post comments" on public.post_comments;
create policy "admins full control post comments"
on public.post_comments for all to authenticated
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "admins full control post likes" on public.post_likes;
create policy "admins full control post likes"
on public.post_likes for all to authenticated
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "admins full control post reports" on public.post_reports;
create policy "admins full control post reports"
on public.post_reports for all to authenticated
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "admins full control saved posts" on public.saved_posts;
create policy "admins full control saved posts"
on public.saved_posts for all to authenticated
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "admins full control notifications" on public.notifications;
create policy "admins full control notifications"
on public.notifications for all to authenticated
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "admins full control families" on public.families;
create policy "admins full control families"
on public.families for all to authenticated
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "admins full control family members" on public.family_members;
create policy "admins full control family members"
on public.family_members for all to authenticated
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Admins can manage community post photos in the public community-posts bucket.
drop policy if exists "admins full control community post photos" on storage.objects;
create policy "admins full control community post photos"
on storage.objects for all to authenticated
using (
  bucket_id = 'community-posts'
  and (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
)
with check (
  bucket_id = 'community-posts'
  and (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

