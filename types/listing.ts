export type ListingPartner = {
  id: string;
  name: string;
  avatarUrl: string | null;
};

export type Listing = {
  id: string;
  supplier?: ListingPartner;
  title: string;
  priceLabel: string;
  imageUrl: string;
  unitPriceCents: number;
  parentCategory?: string;
  subCategory?: string;
  category?: string;
  attributes?: string[];
  variants?: string[];
  unit?: string;
  /** Units available on this partner's listing only. */
  availableUnits: number;
  /** Normalized key matching the same product from other suppliers. */
  catalogKey: string;
  /** Sum of availableUnits for all published suppliers with this catalog key. */
  totalAvailableUnits: number;
};
