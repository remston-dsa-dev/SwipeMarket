-- Enable live return/refund updates for shoppers and partners.

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'return_requests'
  ) then
    alter publication supabase_realtime add table public.return_requests;
  end if;
exception
  when undefined_object then null;
end;
$$;
