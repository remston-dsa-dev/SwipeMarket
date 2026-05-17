import type { AuthError, Session } from "@supabase/supabase-js";
import { ensureProfileRow, isProfileOnboardingComplete } from "@/lib/profile-onboarding";
import { supabase } from "@/lib/supabase";
import type { UserRole } from "@/stores/session-store";
import { useSessionStore } from "@/stores/session-store";

/** Expired, revoked, or missing refresh token in local storage (common after reinstall or project change). */
export function isStaleRefreshTokenError(error: unknown): boolean {
  const message =
    typeof error === "object" && error !== null && "message" in error
      ? String((error as AuthError).message)
      : String(error ?? "");
  const normalized = message.toLowerCase();
  return (
    normalized.includes("refresh token") ||
    normalized.includes("refresh_token") ||
    normalized.includes("invalid jwt")
  );
}

/** Drop broken auth tokens without calling the server (refresh would fail anyway). */
export async function clearStaleSupabaseAuth() {
  try {
    await supabase.auth.signOut({ scope: "local" });
  } catch {
    // Storage may already be empty.
  }
  useSessionStore.getState().clearSession();
}

/**
 * Loads the Supabase session, recovering when a persisted refresh token is invalid
 * so startup does not throw or leave the app in a half-signed-in state.
 */
export async function loadSupabaseSession(): Promise<Session | null> {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error && isStaleRefreshTokenError(error)) {
      await clearStaleSupabaseAuth();
      return null;
    }
    if (error) {
      console.warn("[auth] getSession", error.message);
    }
    return data.session;
  } catch (error) {
    if (isStaleRefreshTokenError(error)) {
      await clearStaleSupabaseAuth();
      return null;
    }
    throw error;
  }
}

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
