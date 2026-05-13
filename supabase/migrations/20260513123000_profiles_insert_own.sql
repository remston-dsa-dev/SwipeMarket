-- Allow the signed-in user to create their own profile row if the auth trigger did not
-- (e.g. hosted project missing handle_new_user, or rare timing). Idempotent with upsert ignoreDuplicates in app.
drop policy if exists "profiles_insert_own" on public.profiles;

create policy "profiles_insert_own"
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid () = id);
