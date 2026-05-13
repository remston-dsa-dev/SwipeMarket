-- Onboarding flag (existing rows stay complete; new users get false from trigger)
alter table public.profiles
  add column if not exists onboarding_complete boolean not null default true;

alter table public.profiles
  add column if not exists avatar_url text;

-- New signups: require onboarding before app home
create or replace function public.handle_new_user ()
  returns trigger
  language plpgsql
  security definer
  set search_path = public
  as $$
declare
  r text;
begin
  r := coalesce(NEW.raw_user_meta_data ->> 'role', 'customer');
  if r not in ('customer', 'supplier') then
    r := 'customer';
  end if;

  insert into public.profiles (id, role, full_name, onboarding_complete)
  values (
    NEW.id,
    r,
    nullif(trim(coalesce(NEW.raw_user_meta_data ->> 'full_name', '')), ''),
    false
  );
  return NEW;
end;
$$;

-- Public avatars bucket
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "avatars_select_public" on storage.objects;
drop policy if exists "avatars_insert_own" on storage.objects;
drop policy if exists "avatars_update_own" on storage.objects;
drop policy if exists "avatars_delete_own" on storage.objects;

create policy "avatars_select_public"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "avatars_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and split_part(name, '/', 1) = auth.uid()::text
  );

create policy "avatars_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and split_part(name, '/', 1) = auth.uid()::text
  );

create policy "avatars_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and split_part(name, '/', 1) = auth.uid()::text
  );
