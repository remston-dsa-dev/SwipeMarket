import { useMemo } from "react";
import { useInventoryStore } from "@/stores/inventory-store";
import type { Listing } from "@/types/listing";
import type { Product } from "@/types/product";

function toListListing(p: Product): Listing {
  return {
    id: p.id,
    title: p.title,
    priceLabel: p.priceLabel,
    imageUrl: p.imageUrl,
    unitPriceCents: p.unitPriceCents,
  };
}

export function useListings(): { data: Listing[]; isLoading: false } {
  const products = useInventoryStore((s) => s.products);
  const data = useMemo(
    () => products.filter((p) => p.stock > 0).map(toListListing),
    [products],
  );
  return { data, isLoading: false };
}
