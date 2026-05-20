import { useQuery } from "@tanstack/react-query";
import { isSupabaseConfigured } from "@/lib/is-supabase-configured";
import { normalizeOrderStatus, type OrderStatus } from "@/lib/order-status";
import { supabase } from "@/lib/supabase";

import type { LineReturnRequestSummary } from "@/lib/order-line";

export type SupplierOrderItem = {
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

export type SupplierOrder = {
  id: string;
  customer_id: string;
  status: OrderStatus;
  total_cents: number;
  created_at: string;
  customer: { full_name: string | null; avatar_url: string | null } | null;
  order_items: SupplierOrderItem[];
};

async function fetchSupplierOrders(supplierId: string): Promise<SupplierOrder[]> {
  const { data, error } = await supabase
    .from("orders")
    .select(
      `
      id,
      customer_id,
      status,
      total_cents,
      created_at,
      customer:profiles!orders_customer_id_fkey(full_name, avatar_url),
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
          created_at,
          customer:profiles!return_requests_customer_id_fkey(full_name, avatar_url)
        )
      )
    `,
    )
    .eq("supplier_id", supplierId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => {
    const customer = row.customer as
      | { full_name: string | null; avatar_url: string | null }
      | { full_name: string | null; avatar_url: string | null }[]
      | null;
    const c = Array.isArray(customer) ? customer[0] ?? null : customer;
    const rawItems = row.order_items as SupplierOrderItem[] | null;
    const orderStatus = normalizeOrderStatus(String(row.status));
    const items = (rawItems ?? []).map((item) => {
      const rawReturns = (item as { return_requests?: Record<string, unknown>[] | null }).return_requests;
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
          return_accepted: r.return_accepted as boolean | null,
          created_at: String(r.created_at),
        })),
      };
    });
    return {
      id: row.id,
      customer_id: row.customer_id,
      status: orderStatus,
      total_cents: Number(row.total_cents),
      created_at: row.created_at,
      customer: c,
      order_items: items,
    };
  });
}

export function useSupplierOrders(supplierId: string | null) {
  const enabled = isSupabaseConfigured() && !!supplierId;

  return useQuery({
    queryKey: ["supplier-orders", supplierId],
    queryFn: () => fetchSupplierOrders(supplierId!),
    enabled,
    staleTime: 0,
  });
}
