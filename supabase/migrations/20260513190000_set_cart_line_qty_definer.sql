-- set_cart_line_qty was SECURITY INVOKER: customers' SELECT on products was hidden by RLS
-- (published + available_units > 0), so FOR UPDATE often saw "no row" → false "Product not found".
-- Run as definer to read/lock inventory; still enforce rules with auth.uid().

create or replace function public.set_cart_line_qty (p_product_id uuid, p_qty integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := (select auth.uid ());
  others int;
  pr record;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  if p_qty < 0 then
    raise exception 'Invalid quantity';
  end if;

  select
    stock,
    qty_allocated,
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

  if p_qty = 0 then
    delete from public.customer_cart_lines
    where customer_id = uid and product_id = p_product_id;
    return;
  end if;

  if not pr.published then
    raise exception 'Product is not available';
  end if;

  select coalesce(sum(qty), 0) into others
  from public.customer_cart_lines
  where product_id = p_product_id and customer_id <> uid;

  if p_qty > pr.stock - pr.qty_allocated - others then
    raise exception 'Not enough units available';
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

revoke all on function public.set_cart_line_qty (uuid, integer) from public;
grant execute on function public.set_cart_line_qty (uuid, integer) to authenticated;
