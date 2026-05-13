import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { isSupabaseConfigured } from "@/lib/is-supabase-configured";
import { rowToProduct } from "@/lib/product-map";
import { supabase } from "@/lib/supabase";
import type { Product } from "@/types/product";

async function fetchSupplierProducts(supplierId: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("supplier_id", supplierId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(rowToProduct);
}

export function useSupplierProducts(supplierId: string | null) {
  const enabled = isSupabaseConfigured() && !!supplierId;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["supplier-products", supplierId],
    queryFn: () => fetchSupplierProducts(supplierId!),
    enabled,
    staleTime: 15_000,
  });

  useEffect(() => {
    if (!enabled || !supplierId) return;

    const channel = supabase
      .channel(`supplier-products-${supplierId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "products",
          filter: `supplier_id=eq.${supplierId}`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: ["supplier-products", supplierId] });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [enabled, supplierId, queryClient]);

  return query;
}
