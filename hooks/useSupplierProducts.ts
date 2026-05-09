import { useQuery } from "@tanstack/react-query";
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

  return useQuery({
    queryKey: ["supplier-products", supplierId],
    queryFn: () => fetchSupplierProducts(supplierId!),
    enabled,
    staleTime: 15_000,
  });
}
