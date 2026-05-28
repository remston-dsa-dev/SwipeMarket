import { useQuery } from "@tanstack/react-query";
import { isSupabaseConfigured } from "@/lib/is-supabase-configured";
import type { RefundKind, ReturnRequestStatus, ReturnResolution } from "@/lib/return-resolution";
import { supabase } from "@/lib/supabase";

export type ReturnRequestRow = {
  id: string;
  order_item_id: string;
  order_id: string;
  customer_id: string;
  supplier_id: string;
  qty: number;
  reason: string | null;
  status: ReturnRequestStatus;
  resolution: ReturnResolution;
  return_accepted: boolean | null;
  refund_kind: RefundKind;
  refund_cents: number;
  supplier_note: string | null;
  created_at: string;
  resolved_at: string | null;
  order_item: {
    title: string;
    image_url: string;
    unit_price_cents: number;
    qty: number;
  };
  supplier: { full_name: string | null; avatar_url: string | null } | null;
  customer: { full_name: string | null; avatar_url: string | null } | null;
};

const RETURN_SELECT = `
  id,
  order_item_id,
  order_id,
  customer_id,
  supplier_id,
  qty,
  reason,
  status,
  resolution,
  return_accepted,
  refund_kind,
  refund_cents,
  supplier_note,
  created_at,
  resolved_at,
  order_item:order_items(title, image_url, unit_price_cents, qty),
  supplier:profiles!return_requests_supplier_id_fkey(full_name, avatar_url),
  customer:profiles!return_requests_customer_id_fkey(full_name, avatar_url)
`;

function mapReturnRow(row: Record<string, unknown>): ReturnRequestRow {
  const unwrap = <T,>(v: T | T[] | null): T | null =>
    Array.isArray(v) ? v[0] ?? null : v;

  return {
    id: String(row.id),
    order_item_id: String(row.order_item_id),
    order_id: String(row.order_id),
    customer_id: String(row.customer_id),
    supplier_id: String(row.supplier_id),
    qty: Number(row.qty),
    reason: row.reason != null ? String(row.reason) : null,
    status: row.status as ReturnRequestStatus,
    resolution: row.resolution as ReturnResolution,
    return_accepted: row.return_accepted as boolean | null,
    refund_kind: row.refund_kind as RefundKind,
    refund_cents: Number(row.refund_cents),
    supplier_note: row.supplier_note != null ? String(row.supplier_note) : null,
    created_at: String(row.created_at),
    resolved_at: row.resolved_at != null ? String(row.resolved_at) : null,
    order_item: unwrap(row.order_item as ReturnRequestRow["order_item"])!,
    supplier: unwrap(row.supplier as ReturnRequestRow["supplier"]),
    customer: unwrap(row.customer as ReturnRequestRow["customer"]),
  };
}

async function fetchCustomerReturns(customerId: string): Promise<ReturnRequestRow[]> {
  const { data, error } = await supabase
    .from("return_requests")
    .select(RETURN_SELECT)
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => mapReturnRow(row as Record<string, unknown>));
}

async function fetchSupplierReturns(supplierId: string): Promise<ReturnRequestRow[]> {
  const { data, error } = await supabase
    .from("return_requests")
    .select(RETURN_SELECT)
    .eq("supplier_id", supplierId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => mapReturnRow(row as Record<string, unknown>));
}

export function useCustomerReturns(customerId: string | null) {
  const enabled = isSupabaseConfigured() && !!customerId;
  const queryKey = ["customer-returns", customerId] as const;

  return useQuery({
    queryKey,
    queryFn: () => fetchCustomerReturns(customerId!),
    enabled,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnReconnect: true,
  });
}

export function useSupplierReturns(supplierId: string | null) {
  const enabled = isSupabaseConfigured() && !!supplierId;
  const queryKey = ["supplier-returns", supplierId] as const;

  return useQuery({
    queryKey,
    queryFn: () => fetchSupplierReturns(supplierId!),
    enabled,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnReconnect: true,
  });
}
