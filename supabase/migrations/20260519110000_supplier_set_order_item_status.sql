-- Per-line fulfillment status for partners; order status derived from line items.

create or replace function public.sync_order_status_from_items (p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  derived text;
  has_active boolean;
begin
  select exists (
    select 1
    from public.order_items oi
    where oi.order_id = p_order_id
      and oi.status <> 'cancelled'
  ) into has_active;

  if not has_active then
    if exists (select 1 from public.order_items oi where oi.order_id = p_order_id) then
      derived := 'cancelled';
    else
      derived := 'placed';
    end if;
  else
    select oi.status into derived
    from public.order_items oi
    where oi.order_id = p_order_id
      and oi.status <> 'cancelled'
    order by case oi.status
      when 'placed' then 1
      when 'processing' then 2
      when 'shipped' then 3
      when 'completed' then 4
      else 0
    end
    limit 1;
  end if;

  update public.orders
  set
    status = derived,
    updated_at = now()
  where id = p_order_id;
end;
$$;

create or replace function public.supplier_set_order_item_status (
  p_order_item_id uuid,
  p_status text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  n int;
  oid uuid;
  uid uuid := (select auth.uid ());
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  if p_status not in ('placed', 'processing', 'shipped', 'completed', 'cancelled') then
    raise exception 'Invalid status';
  end if;

  update public.order_items oi
  set
    status = p_status,
    shipped_at = case
      when p_status in ('shipped', 'completed') and oi.shipped_at is null then now()
      else oi.shipped_at
    end
  from public.orders o
  where oi.id = p_order_item_id
    and oi.order_id = o.id
    and o.supplier_id = uid
  returning oi.order_id into oid;

  get diagnostics n = row_count;
  if n = 0 then
    raise exception 'Order item not found or not permitted';
  end if;

  perform public.sync_order_status_from_items(oid);
end;
$$;

revoke all on function public.supplier_set_order_item_status (uuid, text) from public;
grant execute on function public.supplier_set_order_item_status (uuid, text) to authenticated;

-- After bulk order status, keep order header aligned with lines (all lines were set to same status).
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

  perform public.sync_order_status_from_items(p_order_id);
end;
$$;
