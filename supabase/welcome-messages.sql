-- KANTHA PRANTH — one-time welcome message tracking
-- Run in Supabase Dashboard → SQL Editor.

alter table public.profiles
add column if not exists welcome_message_sent_at timestamptz;
