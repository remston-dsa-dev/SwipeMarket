import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type UserRole = "customer" | "supplier";

export type SessionState = {
  userId: string | null;
  role: UserRole | null;
  /** From Supabase `profiles.onboarding_complete`; not persisted — refreshed on each auth sync. */
  onboardingComplete: boolean;
  /** False until first Supabase getSession / listener sync finishes (or skips if Supabase unset). */
  authInitialized: boolean;
  setSession: (userId: string, role: UserRole, onboardingComplete: boolean) => void;
  clearSession: () => void;
  setAuthInitialized: (value: boolean) => void;
};

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      userId: null,
      role: null,
      onboardingComplete: false,
      authInitialized: false,
      setSession: (userId, role, onboardingComplete) =>
        set({ userId, role, onboardingComplete }),
      clearSession: () =>
        set({ userId: null, role: null, onboardingComplete: false }),
      setAuthInitialized: (authInitialized) => set({ authInitialized }),
    }),
    {
      name: "swipemarket-session",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ userId: state.userId, role: state.role }),
    },
  ),
);
