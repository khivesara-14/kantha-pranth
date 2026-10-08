-- Community post photos
-- Run this once in Supabase Dashboard → SQL Editor.

alter table public.posts add column if not exists image_url text;

insert into storage.buckets (id, name, public)
values ('community-posts', 'community-posts', true)
on conflict (id) do update set public = true;

drop policy if exists "community post photos are publicly readable" on storage.objects;
create policy "community post photos are publicly readable"
on storage.objects for select
to public
using (bucket_id = 'community-posts');

drop policy if exists "users upload community post photos" on storage.objects;
create policy "users upload community post photos"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'community-posts'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "users update own community post photos" on storage.objects;
create policy "users update own community post photos"
on storage.objects for update
to authenticated
using (
  bucket_id = 'community-posts'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'community-posts'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "users delete own community post photos" on storage.objects;
create policy "users delete own community post photos"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'community-posts'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
