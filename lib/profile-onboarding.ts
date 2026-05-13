import { supabase } from "@/lib/supabase";
import type { UserRole } from "@/stores/session-store";

/**
 * Only strict `true` counts as complete. Avoids `Boolean("false") === true` if a value
 * ever arrives as a string, and matches "incomplete until explicitly done" semantics.
 */
export function isProfileOnboardingComplete(value: unknown): boolean {
  return value === true;
}

/** Loads profile after signup/OAuth; retries briefly while the auth trigger inserts the row. */
export async function fetchProfileRoleAndOnboarding(userId: string): Promise<{
  role: UserRole;
  onboardingComplete: boolean;
}> {
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
