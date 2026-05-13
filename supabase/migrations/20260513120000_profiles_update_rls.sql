-- Allow authenticated users to update their own profile (explicit WITH CHECK for UPDATE RLS).
drop policy if exists "profiles_update_own" on public.profiles;

create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using (auth.uid () = id)
  with check (auth.uid () = id);
