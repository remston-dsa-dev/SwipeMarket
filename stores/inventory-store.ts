import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { CartItem } from "@/types/cart";
import type { Product } from "@/types/product";

const INITIAL_PRODUCTS: Product[] = [
  {
    id: "1",
    title: "Vintage Camera Kit",
    description: "Classic 35mm film camera with two lenses, leather strap, and carrying case.",
    priceLabel: "$240",
    unitPriceCents: 24000,
    imageUrl: "https://picsum.photos/id/250/900/1200",
    stock: 3,
    parentCategory: "Electronics",
    subCategory: "Cameras",
    category: "Electronics",
    attributes: ["Vintage", "Collector"],
    variants: ["35mm", "Bundle"],
    unit: "kit",
    qtyAllocated: 0,
  },
  {
    id: "2",
    title: "Minimal Desk Lamp",
    description: "Sleek adjustable arm lamp with warm/cool modes and a built-in USB-C port.",
    priceLabel: "$48",
    unitPriceCents: 4800,
    imageUrl: "https://picsum.photos/id/180/900/1200",
    stock: 12,
    parentCategory: "Home",
    subCategory: "Lighting",
    category: "Home",
    attributes: ["Minimal", "Modern"],
    variants: ["Warm Light", "USB-C"],
    unit: "piece",
    qtyAllocated: 0,
  },
  {
    id: "3",
    title: "Ceramic Pour-Over Set",
    description: "Hand-thrown ceramic dripper, carafe, and two mugs in matte bone-white glaze.",
    priceLabel: "$62",
    unitPriceCents: 6200,
    imageUrl: "https://picsum.photos/id/225/900/1200",
    stock: 7,
    parentCategory: "Kitchen",
    subCategory: "Coffee Gear",
    category: "Kitchen",
    attributes: ["Handmade", "Ceramic"],
    variants: ["2 Mugs", "Bone White"],
    unit: "set",
    qtyAllocated: 0,
  },
  {
    id: "4",
    title: "Wireless Earbuds Pro",
    description: "Active noise-cancelling earbuds with 30h battery and multipoint pairing.",
    priceLabel: "$129",
    unitPriceCents: 12900,
    imageUrl: "https://picsum.photos/id/367/900/1200",
    stock: 5,
    parentCategory: "Electronics",
    subCategory: "Audio",
    category: "Electronics",
    attributes: ["Wireless", "Noise Cancelling"],
    variants: ["ANC", "30h Battery"],
    unit: "pair",
    qtyAllocated: 0,
  },
  {
    id: "5",
    title: "Leather Field Notebook",
    description: "Full-grain leather cover, lay-flat binding, dot-grid paper, 192 pages.",
    priceLabel: "$34",
    unitPriceCents: 3400,
    imageUrl: "https://picsum.photos/id/26/900/1200",
    stock: 20,
    parentCategory: "Office",
    subCategory: "Notebooks",
    category: "Stationery",
    attributes: ["Leather", "Handcrafted"],
    variants: ["Dot Grid", "192 Pages"],
    unit: "piece",
    qtyAllocated: 0,
  },
  {
    id: "6",
    title: "Mechanical Keyboard",
    description: "75% layout, gasket-mounted, hot-swap sockets, tactile switches.",
    priceLabel: "$189",
    unitPriceCents: 18900,
    imageUrl: "https://picsum.photos/id/48/900/1200",
    stock: 4,
    parentCategory: "Electronics",
    subCategory: "Keyboards",
    category: "Electronics",
    attributes: ["Mechanical", "Hot Swap"],
    variants: ["75%", "Tactile"],
    unit: "piece",
    qtyAllocated: 0,
  },
  {
    id: "7",
    title: "Brass Plant Stand Trio",
    description: "Set of three graduated brass ring stands for pots from 4\" to 10\".",
    priceLabel: "$75",
    unitPriceCents: 7500,
    imageUrl: "https://picsum.photos/id/137/900/1200",
    stock: 8,
    parentCategory: "Home",
    subCategory: "Decor",
    category: "Home",
    attributes: ["Decor", "Indoor"],
    variants: ["Trio", "Brass"],
    unit: "set",
    qtyAllocated: 0,
  },
  {
    id: "8",
    title: "Soy Candle Collection",
    description: "Six hand-poured soy candles in seasonal scents, 8 oz each, 45h burn.",
    priceLabel: "$38",
    unitPriceCents: 3800,
    imageUrl: "https://picsum.photos/id/177/900/1200",
    stock: 15,
    parentCategory: "Home",
    subCategory: "Fragrance",
    category: "Home",
    attributes: ["Aromatherapy", "Hand-poured"],
    variants: ["Seasonal", "6 Pack"],
    unit: "pack",
    qtyAllocated: 0,
  },
];

type InventoryState = {
  products: Product[];
  addProduct: (product: Omit<Product, "id">) => void;
  addProductsBulk: (products: Omit<Product, "id">[]) => void;
  updateProduct: (id: string, updates: Partial<Omit<Product, "id">>) => void;
  removeProduct: (id: string) => void;
  adjustStock: (id: string, delta: number) => void;
  allocateFromCart: (items: CartItem[]) => void;
};

export const useInventoryStore = create<InventoryState>()(
  persist(
    (set) => ({
      products: INITIAL_PRODUCTS,
      addProduct: (product) =>
        set((state) => ({
          products: [
            ...state.products,
            { ...product, id: Date.now().toString(), qtyAllocated: product.qtyAllocated ?? 0 },
          ],
        })),
      addProductsBulk: (incomingProducts) =>
        set((state) => ({
          products: [
            ...state.products,
            ...incomingProducts.map((product, idx) => ({
              ...product,
              id: `${Date.now()}-${idx}`,
              qtyAllocated: product.qtyAllocated ?? 0,
            })),
          ],
        })),
      updateProduct: (id, updates) =>
        set((state) => ({
          products: state.products.map((p) =>
            p.id === id ? { ...p, ...updates } : p,
          ),
        })),
      removeProduct: (id) =>
        set((state) => ({
          products: state.products.filter((p) => p.id !== id),
        })),
      adjustStock: (id, delta) =>
        set((state) => ({
          products: state.products.map((p) =>
            p.id === id ? { ...p, stock: Math.max(0, p.stock + delta) } : p,
          ),
        })),
      allocateFromCart: (items) =>
        set((state) => ({
          products: state.products.map((product) => {
            const cartItem = items.find((item) => item.listingId === product.id);
            if (!cartItem) return product;
            return {
              ...product,
              stock: Math.max(0, product.stock - cartItem.qty),
              qtyAllocated: (product.qtyAllocated ?? 0) + cartItem.qty,
            };
          }),
        })),
    }),
    {
      name: "swipemarket-inventory",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
