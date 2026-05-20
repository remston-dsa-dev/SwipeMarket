import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { isSupabaseConfigured } from "@/lib/is-supabase-configured";
import { uniqueRealtimeTopic } from "@/lib/realtime-unique-topic";
import { supabase } from "@/lib/supabase";

/** Subscribe once per shopper session so orders + returns refresh when partners act. */
export function useCustomerRealtime(customerId: string | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!customerId || !isSupabaseConfigured()) return;

    const invalidate = () => {
      void queryClient.invalidateQueries({ queryKey: ["customer-orders", customerId] });
      void queryClient.invalidateQueries({ queryKey: ["customer-returns", customerId] });
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
        invalidate,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `customer_id=eq.${customerId}`,
        },
        invalidate,
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [customerId, queryClient]);
}
