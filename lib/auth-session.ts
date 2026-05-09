import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { UserRole } from "@/stores/session-store";
import { useSessionStore } from "@/stores/session-store";

function normalizeRole(value: string | null | undefined): UserRole {
  return value === "supplier" ? "supplier" : "customer";
}

/** Maps Supabase auth session to persisted Zustand session (profile role). */
export async function syncSessionFromSupabaseAuth(session: Session | null) {
  if (!session) {
    useSessionStore.getState().clearSession();
    return;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .maybeSingle();

  if (error) {
    console.warn("[auth] profile fetch failed", error.message);
    useSessionStore.getState().clearSession();
    return;
  }

  const role = normalizeRole(data?.role);
  useSessionStore.getState().setSession(session.user.id, role);
}
