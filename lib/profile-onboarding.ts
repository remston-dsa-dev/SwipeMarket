import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database";
import type { UserRole } from "@/stores/session-store";

/**
 * Only strict `true` counts as complete. Avoids `Boolean("false") === true` if a value
 * ever arrives as a string, and matches "incomplete until explicitly done" semantics.
 */
export function isProfileOnboardingComplete(value: unknown): boolean {
  return value === true;
}

/**
 * Ensures a `profiles` row exists for the current session user (e.g. Google OAuth when
 * `on_auth_user_created` did not run on the server). Safe if the row already exists.
 */
export async function ensureProfileRow(userId: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.id !== userId) return;

  const row: Database["public"]["Tables"]["profiles"]["Insert"] = {
    id: userId,
    role: "customer",
    onboarding_complete: false,
  };

  const { error } = await supabase.from("profiles").upsert(row, {
    onConflict: "id",
    ignoreDuplicates: true,
  });

  if (error && error.code !== "23505") {
    console.warn("[profile] ensureProfileRow", error.message);
  }
}

/** Loads profile after signup/OAuth; retries briefly while the auth trigger inserts the row. */
export async function fetchProfileRoleAndOnboarding(userId: string): Promise<{
  role: UserRole;
  onboardingComplete: boolean;
}> {
  await ensureProfileRow(userId);

  const maxAttempts = 4;
  const delayMs = 280;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role, onboarding_complete")
      .eq("id", userId)
      .maybeSingle();

    if (!error && profile) {
      const role = (profile.role === "supplier" ? "supplier" : "customer") as UserRole;
      return {
        role,
        onboardingComplete: isProfileOnboardingComplete(profile.onboarding_complete),
      };
    }

    if (attempt < maxAttempts - 1) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }

  return {
    role: "customer",
    onboardingComplete: false,
  };
}
