-- Per-SKU line status, returns count, and ship timestamp for return warranty.

alter table public.order_items
  add column if not exists status text not null default 'placed'
    check (status in ('placed', 'processing', 'shipped', 'completed', 'cancelled')),
  add column if not exists return_qty integer not null default 0 check (return_qty >= 0),
  add column if not exists shipped_at timestamptz;

alter table public.order_items
  drop constraint if exists order_items_return_qty_lte_qty;

alter table public.order_items
  add constraint order_items_return_qty_lte_qty check (return_qty <= qty);

-- Backfill from parent order for existing rows.
update public.order_items oi
set
  status = o.status,
  shipped_at = case
    when o.status in ('shipped', 'completed') then coalesce(oi.shipped_at, o.updated_at)
    else null
  end
from public.orders o
where o.id = oi.order_id;

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

  update public.order_items
  set
    status = p_status,
    shipped_at = case
      when p_status in ('shipped', 'completed') and shipped_at is null then now()
      else shipped_at
    end
  where order_id = p_order_id;
end;
$$;
