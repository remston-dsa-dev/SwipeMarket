import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { isSupabaseConfigured } from "@/lib/is-supabase-configured";
import type { OrderStatus } from "@/lib/order-status";
import { uniqueRealtimeTopic } from "@/lib/realtime-unique-topic";
import { supabase } from "@/lib/supabase";

export type CustomerOrderItem = {
  id: string;
  product_id: string;
  qty: number;
  unit_price_cents: number;
  title: string;
  image_url: string;
};

export type CustomerOrder = {
  id: string;
  supplier_id: string;
  status: OrderStatus;
  total_cents: number;
  created_at: string;
  supplier: { full_name: string | null } | null;
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
      supplier:profiles!orders_supplier_id_fkey(full_name),
      order_items(id, product_id, qty, unit_price_cents, title, image_url)
    `,
    )
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => {
    const supplier = row.supplier as { full_name: string | null } | { full_name: string | null }[] | null;
    const s = Array.isArray(supplier) ? supplier[0] ?? null : supplier;
    const items = row.order_items as CustomerOrderItem[] | null;
    return {
      id: row.id,
      supplier_id: row.supplier_id,
      status: row.status as OrderStatus,
      total_cents: Number(row.total_cents),
      created_at: row.created_at,
      supplier: s,
      order_items: items ?? [],
    };
  });
}

export function useCustomerOrders(customerId: string | null) {
  const enabled = isSupabaseConfigured() && !!customerId;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["customer-orders", customerId],
    queryFn: () => fetchCustomerOrders(customerId!),
    enabled,
    staleTime: 10_000,
  });

  useEffect(() => {
    if (!enabled || !customerId) return;

    const channel = supabase
      .channel(`customer-orders-${customerId}-${uniqueRealtimeTopic()}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `customer_id=eq.${customerId}`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: ["customer-orders", customerId] });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [enabled, customerId, queryClient]);

  return query;
}
