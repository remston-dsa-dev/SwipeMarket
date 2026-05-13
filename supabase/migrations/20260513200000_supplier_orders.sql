-- Orders created at shopper checkout (one row per supplier per checkout batch).

create table public.orders (
  id uuid primary key default gen_random_uuid (),
  customer_id uuid not null references public.profiles (id) on delete restrict,
  supplier_id uuid not null references public.profiles (id) on delete restrict,
  status text not null default 'placed'
    check (status in ('placed', 'processing', 'shipped', 'completed', 'cancelled')),
  total_cents bigint not null default 0 check (total_cents >= 0),
  created_at timestamptz not null default now (),
  updated_at timestamptz not null default now ()
);

create index orders_supplier_id_created_idx on public.orders (supplier_id, created_at desc);
create index orders_customer_id_created_idx on public.orders (customer_id, created_at desc);

create table public.order_items (
  id uuid primary key default gen_random_uuid (),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete restrict,
  qty integer not null check (qty > 0),
  unit_price_cents integer not null check (unit_price_cents >= 0),
  title text not null,
  image_url text not null
);

create index order_items_order_id_idx on public.order_items (order_id);

alter table public.orders enable row level security;
alter table public.order_items enable row level security;

create policy "orders_select_party"
  on public.orders for select
  using (customer_id = auth.uid () or supplier_id = auth.uid ());

create policy "order_items_select_party"
  on public.order_items for select
  using (
    exists (
      select 1
      from public.orders o
      where o.id = order_items.order_id
        and (o.customer_id = auth.uid () or o.supplier_id = auth.uid ())
    )
  );

-- Order status updates: use supplier_set_order_status only (no direct UPDATE policy on orders).

-- Checkout: allocate stock, clear cart, create one order per supplier with line items.
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

  update public.products p
  set
    qty_allocated = p.qty_allocated + l.qty,
    updated_at = now()
  from _checkout_lines l
  where p.id = l.product_id;

  delete from public.customer_cart_lines where customer_id = uid;

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

create or replace function public.supplier_set_order_status (p_order_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  n int;
  uid uuid := (select auth.uid ());
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  if p_status not in ('placed', 'processing', 'shipped', 'completed', 'cancelled') then
    raise exception 'Invalid status';
  end if;

  update public.orders
  set
    status = p_status,
    updated_at = now()
  where id = p_order_id
    and supplier_id = uid;

  get diagnostics n = row_count;
  if n = 0 then
    raise exception 'Order not found or not permitted';
  end if;
end;
$$;

revoke all on function public.supplier_set_order_status (uuid, text) from public;
grant execute on function public.supplier_set_order_status (uuid, text) to authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'orders'
  ) then
    alter publication supabase_realtime add table public.orders;
  end if;
exception
  when undefined_object then null;
end;
$$;
