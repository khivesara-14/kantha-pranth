-- Community post photos
-- Run this once in Supabase Dashboard → SQL Editor.

alter table public.posts add column if not exists image_url text;
alter table public.posts add column if not exists is_pinned boolean not null default false;
create index if not exists posts_pinned_created_at_idx on public.posts(is_pinned desc, created_at desc);

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


-- Community moderation, editing, saved posts and notifications
alter table public.posts add column if not exists updated_at timestamptz not null default now();

create table if not exists public.post_reports (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reason text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

alter table public.post_reports enable row level security;
drop policy if exists "users create post reports" on public.post_reports;
create policy "users create post reports" on public.post_reports for insert to authenticated with check ((select auth.uid()) = reporter_id);
drop policy if exists "users read own post reports" on public.post_reports;
create policy "users read own post reports" on public.post_reports for select to authenticated using ((select auth.uid()) = reporter_id);
drop policy if exists "admins manage post reports" on public.post_reports;
create policy "admins manage post reports" on public.post_reports for all to authenticated
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create table if not exists public.saved_posts (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

alter table public.saved_posts enable row level security;
drop policy if exists "users manage saved posts" on public.saved_posts;
create policy "users manage saved posts" on public.saved_posts for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  post_id uuid references public.posts(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  message text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;
drop policy if exists "users read own notifications" on public.notifications;
create policy "users read own notifications" on public.notifications for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "users update own notifications" on public.notifications;
create policy "users update own notifications" on public.notifications for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create or replace function public.notify_post_like()
returns trigger language plpgsql security definer set search_path = public
as $$
declare post_author uuid;
begin
  select author_id into post_author from public.posts where id = new.post_id;
  if post_author is not null and post_author <> new.user_id then
    insert into public.notifications(user_id,type,post_id,actor_id,message)
    values(post_author,'like',new.post_id,new.user_id,'Someone liked your community post.');
  end if;
  return new;
end $$;

drop trigger if exists post_like_notification on public.post_likes;
create trigger post_like_notification after insert on public.post_likes
for each row execute function public.notify_post_like();

create or replace function public.notify_post_comment()
returns trigger language plpgsql security definer set search_path = public
as $$
declare
  post_author uuid;
  parent_author uuid;
begin
  select author_id into post_author from public.posts where id = new.post_id;

  if post_author is not null and post_author <> new.user_id then
    insert into public.notifications(user_id,type,post_id,actor_id,message)
    values(
      post_author,
      case when new.parent_id is null then 'comment' else 'reply' end,
      new.post_id,
      new.user_id,
      case when new.parent_id is null
        then 'Someone commented on your community post.'
        else 'Someone replied to your community comment.'
      end
    );
  end if;

  if new.parent_id is not null then
    select user_id into parent_author from public.post_comments where id = new.parent_id;
    if parent_author is not null and parent_author <> new.user_id and parent_author <> post_author then
      insert into public.notifications(user_id,type,post_id,actor_id,message)
      values(parent_author,'reply',new.post_id,new.user_id,'Someone replied to your comment.');
    end if;
  end if;

  return new;
end $$;

drop trigger if exists post_comment_notification on public.post_comments;
create trigger post_comment_notification after insert on public.post_comments
for each row execute function public.notify_post_comment();


-- Threaded comment replies
alter table public.post_comments add column if not exists parent_id uuid references public.post_comments(id) on delete cascade;

create index if not exists post_comments_post_id_idx on public.post_comments(post_id);
create index if not exists post_comments_parent_id_idx on public.post_comments(parent_id);

drop policy if exists "users update own post comments" on public.post_comments;
create policy "users update own post comments" on public.post_comments for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
