import type { ReactNode } from "react";
import { useEffect } from "react";
import { syncSessionFromSupabaseAuth } from "@/lib/auth-session";
import { isSupabaseConfigured } from "@/lib/is-supabase-configured";
import { supabase } from "@/lib/supabase";
import { useSessionStore } from "@/stores/session-store";

export function AuthProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const store = useSessionStore.getState();

    if (!isSupabaseConfigured()) {
      store.clearSession();
      store.setAuthInitialized(true);
      return;
    }

    let cancelled = false;

    async function apply(session: Parameters<typeof syncSessionFromSupabaseAuth>[0]) {
      await syncSessionFromSupabaseAuth(session);
      if (!cancelled) store.setAuthInitialized(true);
    }

    void supabase.auth.getSession().then(({ data }) => apply(data.session));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      void apply(session);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  return children;
}
