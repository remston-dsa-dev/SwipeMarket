import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { isSupabaseConfigured } from "@/lib/is-supabase-configured";
import type { OrderStatus } from "@/lib/order-status";
import { uniqueRealtimeTopic } from "@/lib/realtime-unique-topic";
import { supabase } from "@/lib/supabase";

export type SupplierOrderItem = {
  id: string;
  product_id: string;
  qty: number;
  unit_price_cents: number;
  title: string;
  image_url: string;
};

export type SupplierOrder = {
  id: string;
  customer_id: string;
  status: OrderStatus;
  total_cents: number;
  created_at: string;
  customer: { full_name: string | null } | null;
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
      customer:profiles!orders_customer_id_fkey(full_name),
      order_items(id, product_id, qty, unit_price_cents, title, image_url)
    `,
    )
    .eq("supplier_id", supplierId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => {
    const customer = row.customer as { full_name: string | null } | { full_name: string | null }[] | null;
    const c = Array.isArray(customer) ? customer[0] ?? null : customer;
    const items = row.order_items as SupplierOrderItem[] | null;
    return {
      id: row.id,
      customer_id: row.customer_id,
      status: row.status as OrderStatus,
      total_cents: Number(row.total_cents),
      created_at: row.created_at,
      customer: c,
      order_items: items ?? [],
    };
  });
}

export function useSupplierOrders(supplierId: string | null) {
  const enabled = isSupabaseConfigured() && !!supplierId;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["supplier-orders", supplierId],
    queryFn: () => fetchSupplierOrders(supplierId!),
    enabled,
    staleTime: 10_000,
  });

  useEffect(() => {
    if (!enabled || !supplierId) return;

    const channel = supabase
      .channel(`supplier-orders-${supplierId}-${uniqueRealtimeTopic()}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `supplier_id=eq.${supplierId}`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: ["supplier-orders", supplierId] });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [enabled, supplierId, queryClient]);

  return query;
}
