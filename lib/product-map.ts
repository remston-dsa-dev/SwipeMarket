import type { Listing } from "@/types/listing";
import type { Product } from "@/types/product";
import type { Database } from "@/types/database";

export type ProductRow = Database["public"]["Tables"]["products"]["Row"];

export function rowToProduct(row: ProductRow): Product {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    priceLabel: row.price_label,
    unitPriceCents: row.unit_price_cents,
    imageUrl: row.image_url,
    stock: row.stock,
    parentCategory: row.parent_category ?? undefined,
    subCategory: row.sub_category ?? undefined,
    category: row.category ?? undefined,
    attributes: row.attributes.length ? row.attributes : undefined,
    variants: row.variants.length ? row.variants : undefined,
    unit: row.unit ?? undefined,
    qtyAllocated: row.qty_allocated,
    qtyOnHold: row.qty_on_hold,
  };
}

export function productToListing(p: Product): Listing {
  return {
    id: p.id,
    title: p.title,
    priceLabel: p.priceLabel,
    imageUrl: p.imageUrl,
    unitPriceCents: p.unitPriceCents,
    parentCategory: p.parentCategory,
    subCategory: p.subCategory,
    category: p.category,
    attributes: p.attributes,
    variants: p.variants,
    unit: p.unit,
  };
}
