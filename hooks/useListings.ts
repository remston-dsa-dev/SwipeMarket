import { useQuery } from "@tanstack/react-query";
import { isSupabaseConfigured } from "@/lib/is-supabase-configured";
import { productToListing, rowToProduct } from "@/lib/product-map";
import { supabase } from "@/lib/supabase";
import type { Listing } from "@/types/listing";

async function fetchListings(): Promise<Listing[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("published", true)
    .gt("stock", 0)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => productToListing(rowToProduct(row)));
}

export function useListings() {
  const enabled = isSupabaseConfigured();

  const query = useQuery({
    queryKey: ["listings"],
    queryFn: fetchListings,
    enabled,
    staleTime: 30_000,
  });

  return {
    data: query.data ?? [],
    isLoading: enabled ? query.isPending : false,
    error: query.error,
    refetch: query.refetch,
  };
}
