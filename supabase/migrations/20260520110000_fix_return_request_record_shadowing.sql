-- Fix PL/pgSQL record variables shadowing table aliases (error: record "oi" is not assigned).

create or replace function public.customer_create_return_request (
  p_order_item_id uuid,
  p_qty integer,
  p_reason text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid ();
  v_line record;
  pending int;
  eligible int;
  rid uuid;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  if p_qty is null or p_qty < 1 then
    raise exception 'Invalid quantity';
  end if;

  select
    it.id,
    it.order_id,
    it.qty,
    it.return_qty,
    it.status,
    it.shipped_at,
    it.unit_price_cents,
    o.customer_id,
    o.supplier_id
  into v_line
  from public.order_items it
  join public.orders o on o.id = it.order_id
  where it.id = p_order_item_id
    and o.customer_id = uid;

  if not found then
    raise exception 'Order line not found';
  end if;

  if v_line.status <> 'delivered' then
    raise exception 'Returns are only available for delivered items';
  end if;

  if v_line.shipped_at is null then
    raise exception 'Delivery date is not recorded for this item';
  end if;

  if v_line.shipped_at < now() - interval '30 days' then
    raise exception 'Return window has ended (30 days after delivery)';
  end if;

  pending := public.return_line_pending_qty(p_order_item_id);
  eligible := v_line.qty - v_line.return_qty - pending;

  if p_qty > eligible then
    raise exception 'Cannot return more than % units (% already returned, % pending review)', eligible, v_line.return_qty, pending;
  end if;

  insert into public.return_requests (
    order_item_id,
    order_id,
    customer_id,
    supplier_id,
    qty,
    reason
  )
  values (
    p_order_item_id,
    v_line.order_id,
    uid,
    v_line.supplier_id,
    p_qty,
    nullif(trim(p_reason), '')
  )
  returning id into rid;

  return rid;
end;
$$;

create or replace function public.supplier_resolve_return_request (
  p_return_request_id uuid,
  p_resolution text,
  p_refund_cents integer default 0,
  p_supplier_note text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_req record;
  line_total int;
  accepted boolean;
  kind text;
begin
  if auth.uid () is null then
    raise exception 'Not authenticated';
  end if;

  if p_resolution not in (
    'accept_full_refund',
    'accept_partial_refund',
    'deny_full_refund',
    'deny_partial_refund',
    'accept_no_refund',
    'deny_no_refund'
  ) then
    raise exception 'Invalid resolution';
  end if;

  select
    r.id,
    r.order_item_id,
    r.qty,
    r.status,
    r.supplier_id,
    it.unit_price_cents
  into v_req
  from public.return_requests r
  join public.order_items it on it.id = r.order_item_id
  where r.id = p_return_request_id
    and r.supplier_id = auth.uid ()
    and r.status = 'requested';

  if not found then
    raise exception 'Return request not found or already resolved';
  end if;

  accepted := p_resolution like 'accept_%';
  kind := case
    when p_resolution like '%_full_refund' then 'full'
    when p_resolution like '%_partial_refund' then 'partial'
    else 'none'
  end;

  line_total := v_req.qty * v_req.unit_price_cents;

  if kind = 'full' then
    p_refund_cents := line_total;
  elsif kind = 'partial' then
    if p_refund_cents is null or p_refund_cents < 1 then
      raise exception 'Enter a partial refund amount';
    end if;
    if p_refund_cents > line_total then
      raise exception 'Refund cannot exceed line total';
    end if;
  else
    p_refund_cents := 0;
  end if;

  update public.return_requests
  set
    status = 'resolved',
    resolution = p_resolution,
    return_accepted = accepted,
    refund_kind = kind,
    refund_cents = p_refund_cents,
    supplier_note = nullif(trim(p_supplier_note), ''),
    resolved_at = now()
  where id = p_return_request_id;

  if accepted then
    update public.order_items
    set return_qty = least(qty, return_qty + v_req.qty)
    where id = v_req.order_item_id;
  end if;
end;
$$;
