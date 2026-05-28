import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { isSupabaseConfigured } from "@/lib/is-supabase-configured";
import { refetchReturnsForCustomer } from "@/lib/returns-realtime-sync";
import { uniqueRealtimeTopic } from "@/lib/realtime-unique-topic";
import { supabase } from "@/lib/supabase";

/** Subscribe once per shopper session so orders + returns refresh when partners act. */
export function useCustomerRealtime(customerId: string | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!customerId || !isSupabaseConfigured()) return;

    const refresh = () => {
      refetchReturnsForCustomer(queryClient, customerId);
    };

    const channel = supabase
      .channel(`customer-realtime-${customerId}-${uniqueRealtimeTopic()}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "return_requests",
          filter: `customer_id=eq.${customerId}`,
        },
        refresh,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `customer_id=eq.${customerId}`,
        },
        refresh,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "order_items",
        },
        refresh,
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [customerId, queryClient]);
}
