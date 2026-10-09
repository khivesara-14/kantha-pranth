-- Kantha Pranth: private one-to-one messaging
-- Run in Supabase SQL Editor after the base schema.

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  member_one uuid not null references public.profiles(id) on delete cascade,
  member_two uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint conversations_distinct_members check (member_one <> member_two),
  constraint conversations_canonical_members check (member_one < member_two),
  constraint conversations_unique_pair unique (member_one, member_two)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 4000),
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists conversations_member_one_updated_idx
  on public.conversations(member_one, updated_at desc);
create index if not exists conversations_member_two_updated_idx
  on public.conversations(member_two, updated_at desc);
create index if not exists messages_conversation_created_idx
  on public.messages(conversation_id, created_at desc);

alter table public.conversations enable row level security;
alter table public.messages enable row level security;

drop policy if exists "members can view their conversations" on public.conversations;
create policy "members can view their conversations"
  on public.conversations for select to authenticated
  using ((select auth.uid()) = member_one or (select auth.uid()) = member_two);

drop policy if exists "members can start conversations" on public.conversations;
create policy "members can start conversations"
  on public.conversations for insert to authenticated
  with check (
    ((select auth.uid()) = member_one or (select auth.uid()) = member_two)
    and member_one < member_two
    and member_one <> member_two
  );

drop policy if exists "members can update their conversations" on public.conversations;
create policy "members can update their conversations"
  on public.conversations for update to authenticated
  using ((select auth.uid()) = member_one or (select auth.uid()) = member_two)
  with check ((select auth.uid()) = member_one or (select auth.uid()) = member_two);

drop policy if exists "members can read messages in their conversations" on public.messages;
create policy "members can read messages in their conversations"
  on public.messages for select to authenticated
  using (exists (
    select 1 from public.conversations c
    where c.id = conversation_id
      and ((select auth.uid()) = c.member_one or (select auth.uid()) = c.member_two)
  ));

drop policy if exists "members can send messages in their conversations" on public.messages;
create policy "members can send messages in their conversations"
  on public.messages for insert to authenticated
  with check (
    sender_id = (select auth.uid())
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and ((select auth.uid()) = c.member_one or (select auth.uid()) = c.member_two)
    )
  );

drop policy if exists "members can mark received messages read" on public.messages;
create policy "members can mark received messages read"
  on public.messages for update to authenticated
  using (
    sender_id <> (select auth.uid())
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and ((select auth.uid()) = c.member_one or (select auth.uid()) = c.member_two)
    )
  )
  with check (
    sender_id <> (select auth.uid())
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and ((select auth.uid()) = c.member_one or (select auth.uid()) = c.member_two)
    )
  );

create or replace function public.bump_conversation_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.conversations
  set updated_at = now()
  where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists messages_bump_conversation_updated_at on public.messages;
create trigger messages_bump_conversation_updated_at
after insert on public.messages
for each row execute function public.bump_conversation_updated_at();

