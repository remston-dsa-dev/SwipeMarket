import { useQuery } from "@tanstack/react-query";
import { isSupabaseConfigured } from "@/lib/is-supabase-configured";
import { normalizeOrderStatus, type OrderStatus } from "@/lib/order-status";
import { supabase } from "@/lib/supabase";

import type { LineReturnRequestSummary } from "@/lib/order-line";

export type CustomerOrderItem = {
  id: string;
  product_id: string;
  qty: number;
  return_qty: number;
  status: OrderStatus;
  shipped_at: string | null;
  unit_price_cents: number;
  title: string;
  image_url: string;
  return_requests: LineReturnRequestSummary[];
};

export type CustomerOrder = {
  id: string;
  supplier_id: string;
  status: OrderStatus;
  total_cents: number;
  created_at: string;
  supplier: { full_name: string | null; avatar_url: string | null } | null;
  order_items: CustomerOrderItem[];
};

async function fetchCustomerOrders(customerId: string): Promise<CustomerOrder[]> {
  const { data, error } = await supabase
    .from("orders")
    .select(
      `
      id,
      supplier_id,
      status,
      total_cents,
      created_at,
      supplier:profiles!orders_supplier_id_fkey(full_name, avatar_url),
      order_items(
        id,
        product_id,
        qty,
        return_qty,
        status,
        shipped_at,
        unit_price_cents,
        title,
        image_url,
        return_requests(
          id,
          qty,
          reason,
          status,
          resolution,
          refund_kind,
          refund_cents,
          return_accepted,
          created_at
        )
      )
    `,
    )
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => {
    const supplier = row.supplier as
      | { full_name: string | null; avatar_url: string | null }
      | { full_name: string | null; avatar_url: string | null }[]
      | null;
    const s = Array.isArray(supplier) ? supplier[0] ?? null : supplier;
    const rawItems = row.order_items as CustomerOrderItem[] | null;
    const orderStatus = normalizeOrderStatus(String(row.status));
    const items = (rawItems ?? []).map((item) => {
      const rawReturns = (item as { return_requests?: LineReturnRequestSummary[] | null }).return_requests;
      const returns = Array.isArray(rawReturns) ? rawReturns : [];
      return {
        ...item,
        return_qty: Number(item.return_qty ?? 0),
        status: normalizeOrderStatus(String(item.status ?? orderStatus)),
        shipped_at: item.shipped_at ?? null,
        return_requests: returns.map((r) => ({
          id: String(r.id),
          qty: Number(r.qty),
          reason: r.reason != null ? String(r.reason) : null,
          status: r.status as LineReturnRequestSummary["status"],
          resolution: String(r.resolution),
          refund_kind: String(r.refund_kind),
          refund_cents: Number(r.refund_cents),
          return_accepted: r.return_accepted,
          created_at: String(r.created_at),
        })),
      };
    });
    return {
      id: row.id,
      supplier_id: row.supplier_id,
      status: orderStatus,
      total_cents: Number(row.total_cents),
      created_at: row.created_at,
      supplier: s,
      order_items: items,
    };
  });
}

export function useCustomerOrders(customerId: string | null) {
  const enabled = isSupabaseConfigured() && !!customerId;

  const query = useQuery({
    queryKey: ["customer-orders", customerId],
    queryFn: () => fetchCustomerOrders(customerId!),
    enabled,
    staleTime: 0,
  });

  return query;
}
