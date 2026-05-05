import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type UserRole = "customer" | "supplier";
export type ThemePreference = "light" | "dark" | "system";

export type SessionState = {
  userId: string | null;
  role: UserRole | null;
  themePreference: ThemePreference;
  setSession: (userId: string, role: UserRole) => void;
  clearSession: () => void;
  setThemePreference: (preference: ThemePreference) => void;
};

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      userId: null,
      role: null,
      themePreference: "system",
      setSession: (userId, role) => set({ userId, role }),
      clearSession: () => set({ userId: null, role: null }),
      setThemePreference: (themePreference) => set({ themePreference }),
    }),
    {
      name: "swipemarket-session",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        userId: state.userId,
        role: state.role,
        themePreference: state.themePreference,
      }),
    },
  ),
);
