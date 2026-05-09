import type { Database } from "@/types/database";
import type { Product } from "@/types/product";

export type ProductInsertRow = Database["public"]["Tables"]["products"]["Insert"];

export function productToInsertRow(
  supplierId: string,
  p: Omit<Product, "id">,
): ProductInsertRow {
  return {
    supplier_id: supplierId,
    title: p.title,
    description: p.description,
    price_label: p.priceLabel,
    unit_price_cents: p.unitPriceCents,
    image_url: p.imageUrl,
    stock: p.stock,
    parent_category: p.parentCategory ?? null,
    sub_category: p.subCategory ?? null,
    category: p.category ?? null,
    attributes: p.attributes ?? [],
    variants: p.variants ?? [],
    unit: p.unit ?? null,
    qty_allocated: p.qtyAllocated ?? 0,
    published: true,
  };
}
