import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { isSupabaseConfigured } from "@/lib/is-supabase-configured";
import { refetchReturnsForSupplier } from "@/lib/returns-realtime-sync";
import { uniqueRealtimeTopic } from "@/lib/realtime-unique-topic";
import { supabase } from "@/lib/supabase";

/** Subscribe once per partner session so orders + returns refresh when shoppers act. */
export function useSupplierRealtime(supplierId: string | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!supplierId || !isSupabaseConfigured()) return;

    const refresh = () => {
      refetchReturnsForSupplier(queryClient, supplierId);
    };

    const channel = supabase
      .channel(`supplier-realtime-${supplierId}-${uniqueRealtimeTopic()}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "return_requests",
          filter: `supplier_id=eq.${supplierId}`,
        },
        refresh,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `supplier_id=eq.${supplierId}`,
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
  }, [supplierId, queryClient]);
}
