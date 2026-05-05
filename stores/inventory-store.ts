import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
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
  },
  {
    id: "2",
    title: "Minimal Desk Lamp",
    description: "Sleek adjustable arm lamp with warm/cool modes and a built-in USB-C port.",
    priceLabel: "$48",
    unitPriceCents: 4800,
    imageUrl: "https://picsum.photos/id/180/900/1200",
    stock: 12,
  },
  {
    id: "3",
    title: "Ceramic Pour-Over Set",
    description: "Hand-thrown ceramic dripper, carafe, and two mugs in matte bone-white glaze.",
    priceLabel: "$62",
    unitPriceCents: 6200,
    imageUrl: "https://picsum.photos/id/225/900/1200",
    stock: 7,
  },
  {
    id: "4",
    title: "Wireless Earbuds Pro",
    description: "Active noise-cancelling earbuds with 30h battery and multipoint pairing.",
    priceLabel: "$129",
    unitPriceCents: 12900,
    imageUrl: "https://picsum.photos/id/367/900/1200",
    stock: 5,
  },
  {
    id: "5",
    title: "Leather Field Notebook",
    description: "Full-grain leather cover, lay-flat binding, dot-grid paper, 192 pages.",
    priceLabel: "$34",
    unitPriceCents: 3400,
    imageUrl: "https://picsum.photos/id/26/900/1200",
    stock: 20,
  },
  {
    id: "6",
    title: "Mechanical Keyboard",
    description: "75% layout, gasket-mounted, hot-swap sockets, tactile switches.",
    priceLabel: "$189",
    unitPriceCents: 18900,
    imageUrl: "https://picsum.photos/id/48/900/1200",
    stock: 4,
  },
  {
    id: "7",
    title: "Brass Plant Stand Trio",
    description: "Set of three graduated brass ring stands for pots from 4\" to 10\".",
    priceLabel: "$75",
    unitPriceCents: 7500,
    imageUrl: "https://picsum.photos/id/137/900/1200",
    stock: 8,
  },
  {
    id: "8",
    title: "Soy Candle Collection",
    description: "Six hand-poured soy candles in seasonal scents, 8 oz each, 45h burn.",
    priceLabel: "$38",
    unitPriceCents: 3800,
    imageUrl: "https://picsum.photos/id/177/900/1200",
    stock: 15,
  },
];

type InventoryState = {
  products: Product[];
  addProduct: (product: Omit<Product, "id">) => void;
  updateProduct: (id: string, updates: Partial<Omit<Product, "id">>) => void;
  removeProduct: (id: string) => void;
  adjustStock: (id: string, delta: number) => void;
};

export const useInventoryStore = create<InventoryState>()(
  persist(
    (set) => ({
      products: INITIAL_PRODUCTS,
      addProduct: (product) =>
        set((state) => ({
          products: [
            ...state.products,
            { ...product, id: Date.now().toString() },
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
    }),
    {
      name: "swipemarket-inventory",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
