import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { CartItem } from "@/types/cart";

type CartState = {
  items: CartItem[];
  addItem: (snapshot: Omit<CartItem, "qty">, qty: number) => void;
  removeItem: (listingId: string) => void;
  updateQty: (listingId: string, qty: number) => void;
  clearCart: () => void;
  /** Replace cart from server (snake_case rows already mapped). */
  replaceFromServer: (items: CartItem[]) => void;
  totalCents: number;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      totalCents: 0,
      addItem: (snapshot, qty) =>
        set((state) => {
          const existing = state.items.find(
            (i) => i.listingId === snapshot.listingId,
          );
          const items = existing
            ? state.items.map((i) =>
                i.listingId === snapshot.listingId
                  ? { ...i, qty: i.qty + qty }
                  : i,
              )
            : [...state.items, { ...snapshot, qty }];
          return {
            items,
            totalCents: items.reduce(
              (sum, i) => sum + i.qty * i.unitPriceCents,
              0,
            ),
          };
        }),
      removeItem: (listingId) =>
        set((state) => {
          const items = state.items.filter((i) => i.listingId !== listingId);
          return {
            items,
            totalCents: items.reduce(
              (sum, i) => sum + i.qty * i.unitPriceCents,
              0,
            ),
          };
        }),
      updateQty: (listingId, qty) =>
        set((state) => {
          const items =
            qty <= 0
              ? state.items.filter((i) => i.listingId !== listingId)
              : state.items.map((i) =>
                  i.listingId === listingId ? { ...i, qty } : i,
                );
          return {
            items,
            totalCents: items.reduce(
              (sum, i) => sum + i.qty * i.unitPriceCents,
              0,
            ),
          };
        }),
      clearCart: () => set({ items: [], totalCents: 0 }),
      replaceFromServer: (items) =>
        set({
          items,
          totalCents: items.reduce((sum, i) => sum + i.qty * i.unitPriceCents, 0),
        }),
    }),
    {
      name: "swipemarket-cart",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        items: state.items,
        totalCents: state.totalCents,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.totalCents = state.items.reduce(
            (sum, i) => sum + i.qty * i.unitPriceCents,
            0,
          );
        }
      },
    },
  ),
);
