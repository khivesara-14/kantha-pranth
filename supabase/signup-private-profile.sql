-- KANTHA PRANTH — keep private signup details out of auth metadata.
-- Run once in Supabase Dashboard → SQL Editor after reviewing the existing profile_private schema.
--
-- Copies personal details into public.profile_private on signup and removes them
-- from auth.users metadata only when the inserts succeed.

create or replace function public.handle_new_user_private_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
begin
  begin
    insert into public.profiles (id, full_name)
    values (new.id, coalesce(meta->>'full_name', ''))
    on conflict (id) do nothing;

    insert into public.profile_private (
      id, phone, mobile_number, date_of_birth, marital_status,
      blood_group, occupation, highest_education, parents_name
    ) values (
      new.id,
      nullif(meta->>'mobile_number', ''),
      nullif(meta->>'mobile_number', ''),
      nullif(meta->>'date_of_birth', '')::date,
      nullif(meta->>'marital_status', ''),
      nullif(meta->>'blood_group', ''),
      nullif(meta->>'occupation', ''),
      nullif(meta->>'highest_education', ''),
      nullif(meta->>'parents_name', '')
    )
    on conflict (id) do nothing;

    update auth.users
       set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb)
         - 'date_of_birth' - 'marital_status' - 'blood_group' - 'mobile_number'
         - 'phone' - 'occupation' - 'highest_education' - 'parents_name'
     where id = new.id;
  exception when others then
    raise warning 'handle_new_user_private_profile failed for %: %', new.id, sqlerrm;
  end;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_private_profile on auth.users;
create trigger on_auth_user_created_private_profile
  after insert on auth.users
  for each row execute function public.handle_new_user_private_profile();

-- OPTIONAL cleanup only after confirming every existing user's private details are saved:
-- update auth.users
--    set raw_user_meta_data = raw_user_meta_data
--      - 'date_of_birth' - 'marital_status' - 'blood_group' - 'mobile_number'
--      - 'phone' - 'occupation' - 'highest_education' - 'parents_name'
--  where id in (select id from public.profile_private);
