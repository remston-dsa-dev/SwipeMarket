export type Listing = {
  id: string;
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
};
