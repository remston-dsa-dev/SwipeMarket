import type { Listing } from "@/types/listing";
import type { CartItem } from "@/types/cart";

export function catalogQtyInCart(catalogKey: string, cartItems: CartItem[], listings: Listing[]): number {
  let sum = 0;
  for (const item of cartItems) {
    const listing = listings.find((l) => l.id === item.listingId);
    if (listing?.catalogKey === catalogKey) sum += item.qty;
  }
  return sum;
}

function qtyOnListingLine(listingId: string, cartItems: CartItem[]): number {
  return cartItems.find((i) => i.listingId === listingId)?.qty ?? 0;
}

/** Max total qty allowed on this partner's cart line (pool cap and partner stock cap). */
export function listingMaxLineTotal(
  listing: Pick<Listing, "id" | "availableUnits" | "totalAvailableUnits" | "catalogKey">,
  cartItems: CartItem[],
  listings: Listing[],
): number {
  const inCatalog = catalogQtyInCart(listing.catalogKey, cartItems, listings);
  const onLine = qtyOnListingLine(listing.id, cartItems);
  const poolCap = listing.totalAvailableUnits - inCatalog + onLine;
  const partnerCap = listing.availableUnits + onLine;
  return Math.max(0, Math.min(Math.floor(poolCap), Math.floor(partnerCap)));
}

/** Units the shopper can still add on this listing (min of pool and partner limits). */
export function listingMaxAddQty(
  listing: Pick<Listing, "id" | "availableUnits" | "totalAvailableUnits" | "catalogKey">,
  cartItems: CartItem[],
  listings: Listing[],
): number {
  const onLine = qtyOnListingLine(listing.id, cartItems);
  return Math.max(0, listingMaxLineTotal(listing, cartItems, listings) - onLine);
}

/** @deprecated Use listingMaxLineTotal */
export function listingMaxCartTotal(
  listing: Pick<Listing, "id" | "availableUnits" | "totalAvailableUnits" | "catalogKey">,
  cartItems: CartItem[],
  listings: Listing[],
): number {
  return listingMaxLineTotal(listing, cartItems, listings);
}
