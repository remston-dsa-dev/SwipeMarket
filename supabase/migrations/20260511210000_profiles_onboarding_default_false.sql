-- Align column default with new-user trigger (false). Inserts that omit the column should require onboarding.
alter table public.profiles alter column onboarding_complete set default false;
