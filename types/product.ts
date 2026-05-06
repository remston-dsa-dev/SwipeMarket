export type Product = {
  id: string;
  title: string;
  description: string;
  priceLabel: string;
  unitPriceCents: number;
  imageUrl: string;
  stock: number;
  parentCategory?: string;
  subCategory?: string;
  category?: string;
  attributes?: string[];
  variants?: string[];
  unit?: string;
  qtyAllocated?: number;
};
