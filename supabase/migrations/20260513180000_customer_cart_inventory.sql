-- Server-backed cart holds → products.qty_on_hold; checkout → qty_allocated.
-- Browse uses available_units = stock - qty_on_hold - qty_allocated.

alter table public.products
  add column if not exists qty_on_hold integer not null default 0 check (qty_on_hold >= 0);

update public.products set qty_on_hold = 0 where qty_on_hold is null;

alter table public.products
  add column if not exists available_units integer
  generated always as (stock - qty_on_hold - qty_allocated) stored;

alter table public.products
  add constraint products_stock_covers_hold_and_allocated
  check (stock >= qty_on_hold + qty_allocated);

drop index if exists public.products_stock_published_idx;

create index products_available_published_idx on public.products (available_units, published)
  where published = true and available_units > 0;

create table public.customer_cart_lines (
  customer_id uuid not null references auth.users (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete restrict,
  qty integer not null check (qty > 0),
  title text not null,
  price_label text not null,
  image_url text not null,
  unit_price_cents integer not null check (unit_price_cents >= 0),
  updated_at timestamptz not null default now(),
  primary key (customer_id, product_id)
);

create index customer_cart_lines_product_id_idx on public.customer_cart_lines (product_id);

create or replace function public.recompute_product_qty_on_hold (p_product_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  s int;
begin
  select coalesce(sum(qty), 0)::int into s from public.customer_cart_lines where product_id = p_product_id;
  update public.products
  set qty_on_hold = s,
      updated_at = now()
  where id = p_product_id;
end;
$$;

create or replace function public.cart_lines_touch_product_hold ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform public.recompute_product_qty_on_hold (old.product_id);
    return old;
  end if;
  if tg_op = 'UPDATE' and old.product_id is distinct from new.product_id then
    perform public.recompute_product_qty_on_hold (old.product_id);
    perform public.recompute_product_qty_on_hold (new.product_id);
    return new;
  end if;
  perform public.recompute_product_qty_on_hold (new.product_id);
  return new;
end;
$$;

drop trigger if exists tr_cart_lines_touch_product_hold on public.customer_cart_lines;

create trigger tr_cart_lines_touch_product_hold
after insert or update or delete on public.customer_cart_lines
for each row execute procedure public.cart_lines_touch_product_hold ();

create or replace function public.prevent_delete_product_in_shopper_carts ()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if exists (
    select 1 from public.customer_cart_lines c where c.product_id = old.id
  ) then
    raise exception 'Cannot delete this product while it is in a shopper cart.';
  end if;
  return old;
end;
$$;

drop trigger if exists tr_products_no_delete_in_cart on public.products;

create trigger tr_products_no_delete_in_cart
before delete on public.products
for each row execute procedure public.prevent_delete_product_in_shopper_carts ();

alter table public.customer_cart_lines enable row level security;

create policy "cart_lines_select_own"
  on public.customer_cart_lines for select
  using (customer_id = auth.uid ());

create policy "cart_lines_insert_own"
  on public.customer_cart_lines for insert
  with check (customer_id = auth.uid ());

create policy "cart_lines_update_own"
  on public.customer_cart_lines for update
  using (customer_id = auth.uid ())
  with check (customer_id = auth.uid ());

create policy "cart_lines_delete_own"
  on public.customer_cart_lines for delete
  using (customer_id = auth.uid ());

drop policy if exists "products_select_browse_or_own" on public.products;

create policy "products_select_browse_or_own"
  on public.products for select
  using (
    auth.role () = 'authenticated'
    and (
      (published = true and available_units > 0)
      or supplier_id = auth.uid ()
    )
  );

create or replace function public.set_cart_line_qty (p_product_id uuid, p_qty integer)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  uid uuid := auth.uid ();
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
    unit_price_cents
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

create or replace function public.checkout_cart ()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := (select auth.uid ());
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  with removed as (
    delete from public.customer_cart_lines
    where customer_id = uid
    returning product_id, qty
  )
  update public.products p
  set
    qty_allocated = p.qty_allocated + r.qty,
    updated_at = now()
  from removed r
  where p.id = r.product_id;
end;
$$;

revoke all on function public.checkout_cart () from public;
revoke all on function public.set_cart_line_qty (uuid, integer) from public;

grant execute on function public.set_cart_line_qty (uuid, integer) to authenticated;
grant execute on function public.checkout_cart () to authenticated;

revoke all on function public.recompute_product_qty_on_hold (uuid) from public;
revoke all on function public.cart_lines_touch_product_hold () from public;
revoke all on function public.prevent_delete_product_in_shopper_carts () from public;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'products'
  ) then
    alter publication supabase_realtime add table public.products;
  end if;
exception
  when undefined_object then null;
end;
$$;
