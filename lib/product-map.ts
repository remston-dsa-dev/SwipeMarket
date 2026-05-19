import { catalogKeyFromTitle } from "@/lib/catalog-key";
import type { Listing } from "@/types/listing";
import type { Product } from "@/types/product";
import type { Database } from "@/types/database";

export type ProductRow = Database["public"]["Tables"]["products"]["Row"];

type SupplierProfile = { id: string; full_name: string | null; avatar_url: string | null };

type ProductRowWithSupplier = ProductRow & {
  supplier?: SupplierProfile | SupplierProfile[] | null;
};

function resolveSupplier(row: ProductRowWithSupplier): Pick<Product, "supplierId" | "supplierName" | "supplierAvatarUrl"> {
  const raw = row.supplier;
  const s = Array.isArray(raw) ? raw[0] ?? null : raw;
  return {
    supplierId: s?.id ?? row.supplier_id,
    supplierName: s?.full_name ?? null,
    supplierAvatarUrl: s?.avatar_url ?? null,
  };
}

export function rowToProduct(row: ProductRowWithSupplier): Product {
  return {
    id: row.id,
    ...resolveSupplier(row),
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
    availableUnits: row.available_units,
    catalogKey: row.catalog_key?.trim() || catalogKeyFromTitle(row.title),
  };
}

export function productToListing(p: Product): Listing {
  const partner =
    p.supplierId != null
      ? {
          id: p.supplierId,
          name: p.supplierName?.trim() || "Partner",
          avatarUrl: p.supplierAvatarUrl ?? null,
        }
      : undefined;

  return {
    id: p.id,
    supplier: partner,
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
    availableUnits:
      p.availableUnits ??
      Math.max(0, p.stock - (p.qtyOnHold ?? 0) - (p.qtyAllocated ?? 0)),
    catalogKey: p.catalogKey ?? catalogKeyFromTitle(p.title),
    totalAvailableUnits:
      p.availableUnits ??
      Math.max(0, p.stock - (p.qtyOnHold ?? 0) - (p.qtyAllocated ?? 0)),
  };
}

/** Attach pooled availability after building a listing array from products. */
export function withCatalogPools(listings: Listing[]): Listing[] {
  const poolByCatalog = new Map<string, number>();
  for (const l of listings) {
    poolByCatalog.set(l.catalogKey, (poolByCatalog.get(l.catalogKey) ?? 0) + l.availableUnits);
  }
  return listings.map((l) => ({
    ...l,
    totalAvailableUnits: poolByCatalog.get(l.catalogKey) ?? l.availableUnits,
  }));
}
