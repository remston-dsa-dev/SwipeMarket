import { clearMyServerCart } from "@/lib/cart-remote";
import { isSupabaseConfigured } from "@/lib/is-supabase-configured";
import { supabase } from "@/lib/supabase";
import { useCartStore } from "@/stores/cart-store";
import { useSessionStore } from "@/stores/session-store";

export async function signOutApp() {
  if (isSupabaseConfigured()) {
    try {
      await clearMyServerCart();
    } catch {
      // Still sign out locally if cart clear fails (e.g. offline).
    }
    await supabase.auth.signOut();
  }
  useSessionStore.getState().clearSession();
  useCartStore.getState().clearCart();
}
