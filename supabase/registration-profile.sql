-- KANTHA PRANTH — registration profile fields
-- Run this once in Supabase Dashboard → SQL Editor.

alter table public.profiles add column if not exists date_of_birth date;
alter table public.profiles add column if not exists marital_status text;
alter table public.profiles add column if not exists blood_group text;
alter table public.profiles add column if not exists mobile_number text;
alter table public.profiles add column if not exists occupation text;
alter table public.profiles add column if not exists highest_education text;
alter table public.profiles add column if not exists parents_name text;

-- Keep mobile number available through the existing phone field as well.
update public.profiles
set phone = mobile_number
where (phone is null or trim(phone) = '')
  and mobile_number is not null;