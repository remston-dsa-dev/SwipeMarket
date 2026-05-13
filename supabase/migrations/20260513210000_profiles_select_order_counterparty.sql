-- Allow order parties to read the counterparty profile row (e.g. full_name) for order UIs.
create policy "profiles_select_order_counterparty"
  on public.profiles for select
  using (
    exists (
      select 1
      from public.orders o
      where
        (o.supplier_id = auth.uid () and o.customer_id = profiles.id)
        or (o.customer_id = auth.uid () and o.supplier_id = profiles.id)
    )
  );
