import type { Session } from "@supabase/supabase-js";
import { isProfileOnboardingComplete } from "@/lib/profile-onboarding";
import { supabase } from "@/lib/supabase";
import type { UserRole } from "@/stores/session-store";
import { useSessionStore } from "@/stores/session-store";

function normalizeRole(value: string | null | undefined): UserRole {
  return value === "supplier" ? "supplier" : "customer";
}

/** Maps Supabase auth session to persisted Zustand session (profile role + onboarding). */
export async function syncSessionFromSupabaseAuth(session: Session | null) {
  if (!session) {
    useSessionStore.getState().clearSession();
    return;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("role, onboarding_complete")
    .eq("id", session.user.id)
    .maybeSingle();

  if (error) {
    console.warn("[auth] profile fetch failed", error.message);
    // Keep the Supabase session in the store so OAuth / deep-link flows are not
    // torn down by a transient error or a brief race before the profile row exists.
    useSessionStore
      .getState()
      .setSession(session.user.id, "customer", false);
    return;
  }

  const role = normalizeRole(data?.role);
  const onboardingComplete = isProfileOnboardingComplete(data?.onboarding_complete);
  useSessionStore.getState().setSession(session.user.id, role, onboardingComplete);
}
