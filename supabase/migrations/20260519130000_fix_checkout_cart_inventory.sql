-- checkout_cart must clear cart holds before increasing qty_allocated, otherwise
-- products_stock_covers_hold_and_allocated fails (hold + allocated both count cart qty).

create or replace function public.checkout_cart ()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := (select auth.uid ());
  sid uuid;
  oid uuid;
  tot bigint;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  drop table if exists _checkout_lines;
  create temp table _checkout_lines (
    product_id uuid not null,
    qty integer not null,
    title text not null,
    image_url text not null,
    unit_price_cents integer not null,
    supplier_id uuid not null
  ) on commit drop;

  insert into _checkout_lines (product_id, qty, title, image_url, unit_price_cents, supplier_id)
  select c.product_id, c.qty, c.title, c.image_url, c.unit_price_cents, p.supplier_id
  from public.customer_cart_lines c
  join public.products p on p.id = c.product_id
  where c.customer_id = uid;

  if not exists (select 1 from _checkout_lines) then
    return;
  end if;

  -- Cart lines still on hold here; allow checkout when qty fits after this user's hold is released.
  if exists (
    select 1
    from _checkout_lines l
    join public.products p on p.id = l.product_id
    where l.qty > p.stock - p.qty_allocated - p.qty_on_hold + l.qty
  ) then
    raise exception 'Not enough units available for checkout';
  end if;

  delete from public.customer_cart_lines where customer_id = uid;

  if exists (
    select 1
    from _checkout_lines l
    join public.products p on p.id = l.product_id
    where l.qty > p.stock - p.qty_allocated - p.qty_on_hold
  ) then
    raise exception 'Not enough units available for checkout';
  end if;

  update public.products p
  set
    qty_allocated = p.qty_allocated + l.qty,
    updated_at = now()
  from _checkout_lines l
  where p.id = l.product_id;

  for sid in select distinct supplier_id from _checkout_lines
  loop
    select coalesce(sum(qty::bigint * unit_price_cents::bigint), 0)::bigint into tot
    from _checkout_lines
    where supplier_id = sid;

    insert into public.orders (customer_id, supplier_id, status, total_cents)
    values (uid, sid, 'placed', tot)
    returning id into oid;

    insert into public.order_items (order_id, product_id, qty, unit_price_cents, title, image_url)
    select oid, product_id, qty, unit_price_cents, title, image_url
    from _checkout_lines
    where supplier_id = sid;
  end loop;
end;
$$;
