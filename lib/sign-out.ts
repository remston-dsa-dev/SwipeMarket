import { isSupabaseConfigured } from "@/lib/is-supabase-configured";
import { supabase } from "@/lib/supabase";
import { useSessionStore } from "@/stores/session-store";

export async function signOutApp() {
  if (isSupabaseConfigured()) {
    await supabase.auth.signOut();
  }
  useSessionStore.getState().clearSession();
}
