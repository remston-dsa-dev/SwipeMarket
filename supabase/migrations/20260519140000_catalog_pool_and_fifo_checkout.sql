-- Pool inventory by catalog_key (same product across suppliers); checkout allocates FIFO by created_at.

alter table public.products
  add column if not exists catalog_key text;

update public.products
set catalog_key = lower(trim(regexp_replace(title, '\s+', ' ', 'g')))
where catalog_key is null or catalog_key = '';

alter table public.products
  alter column catalog_key set default '';

alter table public.products
  alter column catalog_key set not null;

create index if not exists products_catalog_key_published_idx
  on public.products (catalog_key, created_at)
  where published = true;

create or replace function public.products_set_catalog_key ()
returns trigger
language plpgsql
as $$
begin
  new.catalog_key := lower(trim(regexp_replace(new.title, '\s+', ' ', 'g')));
  return new;
end;
$$;

drop trigger if exists tr_products_set_catalog_key on public.products;

create trigger tr_products_set_catalog_key
before insert or update of title on public.products
for each row execute procedure public.products_set_catalog_key ();

create or replace function public.catalog_available_units (p_catalog_key text)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(sum(available_units), 0)::integer
  from public.products
  where catalog_key = p_catalog_key
    and published = true;
$$;

revoke all on function public.catalog_available_units (text) from public;
grant execute on function public.catalog_available_units (text) to authenticated;

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
  rec record;
  remaining int;
  take int;
  avail int;
  my_cart_qty int;
  prod record;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  drop table if exists _cart_catalog;
  create temp table _cart_catalog (
    catalog_key text not null,
    need_qty integer not null
  ) on commit drop;

  insert into _cart_catalog (catalog_key, need_qty)
  select p.catalog_key, sum(c.qty)::integer
  from public.customer_cart_lines c
  join public.products p on p.id = c.product_id
  where c.customer_id = uid
  group by p.catalog_key;

  if not exists (select 1 from _cart_catalog) then
    return;
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

  for rec in select catalog_key, need_qty from _cart_catalog
  loop
    remaining := rec.need_qty;

    for prod in
      select
        p.id,
        p.supplier_id,
        p.title,
        p.image_url,
        p.unit_price_cents,
        p.stock,
        p.qty_allocated,
        p.qty_on_hold
      from public.products p
      where p.catalog_key = rec.catalog_key
        and p.published = true
      order by p.created_at asc
      for update
    loop
      exit when remaining <= 0;

      select coalesce(c.qty, 0)::int into my_cart_qty
      from public.customer_cart_lines c
      where c.customer_id = uid
        and c.product_id = prod.id;

      avail := prod.stock - prod.qty_allocated - prod.qty_on_hold + my_cart_qty;

      take := least(remaining, greatest(avail, 0));
      if take > 0 then
        insert into _checkout_lines (
          product_id,
          qty,
          title,
          image_url,
          unit_price_cents,
          supplier_id
        )
        values (
          prod.id,
          take,
          prod.title,
          prod.image_url,
          prod.unit_price_cents,
          prod.supplier_id
        );
        remaining := remaining - take;
      end if;
    end loop;

    if remaining > 0 then
      raise exception 'Not enough units available for checkout';
    end if;
  end loop;

  delete from public.customer_cart_lines where customer_id = uid;

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
