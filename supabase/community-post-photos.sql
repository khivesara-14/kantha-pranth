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


-- Post likes
create table if not exists public.post_likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

alter table public.post_likes enable row level security;

drop policy if exists "post likes are readable" on public.post_likes;
create policy "post likes are readable" on public.post_likes
for select to authenticated
using (true);

drop policy if exists "users like posts" on public.post_likes;
create policy "users like posts" on public.post_likes
for insert to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "users unlike posts" on public.post_likes;
create policy "users unlike posts" on public.post_likes
for delete to authenticated
using ((select auth.uid()) = user_id);

-- Post comments
create table if not exists public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(trim(body)) > 0),
  created_at timestamptz not null default now()
);

alter table public.post_comments enable row level security;

drop policy if exists "post comments are readable" on public.post_comments;
create policy "post comments are readable" on public.post_comments
for select to authenticated
using (true);

drop policy if exists "users create post comments" on public.post_comments;
create policy "users create post comments" on public.post_comments
for insert to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "users delete own post comments" on public.post_comments;
create policy "users delete own post comments" on public.post_comments
for delete to authenticated
using ((select auth.uid()) = user_id);
