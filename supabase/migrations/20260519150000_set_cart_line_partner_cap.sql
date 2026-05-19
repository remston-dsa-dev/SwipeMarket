-- Cart lines are per product row: qty cannot exceed that partner's stock (pool total is across suppliers).

create or replace function public.set_cart_line_qty (p_product_id uuid, p_qty integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := (select auth.uid ());
  catalog_in_cart int;
  catalog_avail int;
  my_line_qty int;
  partner_avail int;
  ck text;
  pr record;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  if p_qty < 0 then
    raise exception 'Invalid quantity';
  end if;

  select
    catalog_key,
    stock,
    qty_allocated,
    qty_on_hold,
    title,
    price_label,
    image_url,
    unit_price_cents,
    published
  into pr
  from public.products
  where id = p_product_id
  for update;

  if not found then
    raise exception 'Product not found';
  end if;

  ck := pr.catalog_key;

  if p_qty = 0 then
    delete from public.customer_cart_lines
    where customer_id = uid and product_id = p_product_id;
    return;
  end if;

  if not pr.published then
    raise exception 'Product is not available';
  end if;

  perform 1
  from public.products
  where catalog_key = ck
    and published = true
  for update;

  select coalesce(c.qty, 0) into my_line_qty
  from public.customer_cart_lines c
  where c.customer_id = uid
    and c.product_id = p_product_id;

  partner_avail := pr.stock - pr.qty_allocated - pr.qty_on_hold + my_line_qty;

  if p_qty > partner_avail then
    raise exception 'Not enough units available from this partner';
  end if;

  select coalesce(sum(c.qty), 0) into catalog_in_cart
  from public.customer_cart_lines c
  join public.products p on p.id = c.product_id
  where c.customer_id = uid
    and p.catalog_key = ck
    and c.product_id <> p_product_id;

  select coalesce(sum(available_units), 0)::int into catalog_avail
  from public.products
  where catalog_key = ck
    and published = true;

  if p_qty + catalog_in_cart > catalog_avail then
    raise exception 'Not enough units available across suppliers';
  end if;

  insert into public.customer_cart_lines (
    customer_id,
    product_id,
    qty,
    title,
    price_label,
    image_url,
    unit_price_cents,
    updated_at
  )
  values (
    uid,
    p_product_id,
    p_qty,
    pr.title,
    pr.price_label,
    pr.image_url,
    pr.unit_price_cents,
    now()
  )
  on conflict (customer_id, product_id) do update
  set
    qty = excluded.qty,
    title = excluded.title,
    price_label = excluded.price_label,
    image_url = excluded.image_url,
    unit_price_cents = excluded.unit_price_cents,
    updated_at = now();
end;
$$;
