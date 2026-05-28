import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { isSupabaseConfigured } from "@/lib/is-supabase-configured";
import { uniqueRealtimeTopic } from "@/lib/realtime-unique-topic";
import { productToListing, rowToProduct, withCatalogPools } from "@/lib/product-map";
import { supabase } from "@/lib/supabase";
import type { Listing } from "@/types/listing";

async function fetchListings(): Promise<Listing[]> {
  const { data, error } = await supabase
    .from("products")
    .select(
      `
      *,
      supplier:profiles!products_supplier_id_fkey(id, full_name, avatar_url)
    `,
    )
    .eq("published", true)
    .gt("available_units", 0)
    .gt("available_units", 0)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const listings = (data ?? []).map((row) => productToListing(rowToProduct(row)));
  return withCatalogPools(listings);
}

export function useListings() {
  const enabled = isSupabaseConfigured();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["listings"],
    queryFn: fetchListings,
    enabled,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!enabled) return;

    const channel = supabase
      .channel(`listings-products-${uniqueRealtimeTopic()}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products", filter: "published=eq.true" },
        () => {
          void queryClient.invalidateQueries({ queryKey: ["listings"] });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [enabled, queryClient]);

  return {
    data: query.data ?? [],
    isLoading: enabled ? query.isPending : false,
    error: query.error,
    refetch: query.refetch,
  };
}
