-- Shoppers can read supplier name/avatar for partners with published in-stock listings.

create policy "profiles_select_published_supplier"
  on public.profiles for select
  using (
    role = 'supplier'
    and exists (
      select 1
      from public.products p
      where p.supplier_id = profiles.id
        and p.published = true
        and p.available_units > 0
    )
  );
