import type { Session } from "@supabase/supabase-js";
import { ensureProfileRow, isProfileOnboardingComplete } from "@/lib/profile-onboarding";
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

  let { data, error } = await supabase
    .from("profiles")
    .select("role, onboarding_complete")
    .eq("id", session.user.id)
    .maybeSingle();

  if (!error && data == null) {
    await ensureProfileRow(session.user.id);
    const again = await supabase
      .from("profiles")
      .select("role, onboarding_complete")
      .eq("id", session.user.id)
      .maybeSingle();
    data = again.data;
    error = again.error;
  }

  if (error) {
    console.warn("[auth] profile fetch failed", error.message);
    // Keep the Supabase session in the store so OAuth / deep-link flows are not
    // torn down by a transient error or a brief race before the profile row exists.
    useSessionStore
      .getState()
      .setSession(session.user.id, "customer", false);
    return;
  }

  let profile = data;
  let onboardingComplete = isProfileOnboardingComplete(profile?.onboarding_complete);
  const prev = useSessionStore.getState();
  // Avoid clobbering a just-finished onboarding: USER_UPDATED can run before the profile
  // row is readable as complete; one short retry fixes read-after-write.
  if (
    prev.userId === session.user.id &&
    prev.onboardingComplete &&
    !onboardingComplete
  ) {
    await new Promise((r) => setTimeout(r, 450));
    const { data: retryData, error: retryErr } = await supabase
      .from("profiles")
      .select("role, onboarding_complete")
      .eq("id", session.user.id)
      .maybeSingle();
    if (!retryErr && retryData) {
      profile = retryData;
      onboardingComplete = isProfileOnboardingComplete(retryData.onboarding_complete);
    }
  }

  const role = normalizeRole(profile?.role);
  useSessionStore.getState().setSession(session.user.id, role, onboardingComplete);
}
