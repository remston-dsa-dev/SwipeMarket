import * as Linking from "expo-linking";

/** OAuth + email confirmation links (signUp `emailRedirectTo`). Add to Supabase Redirect URLs. */
export function getOAuthRedirectTo(): string {
  return Linking.createURL("/auth/callback");
}

/** Password recovery email (`resetPasswordForEmail` redirectTo). Add to Supabase Redirect URLs. */
export function getPasswordRecoveryRedirectTo(): string {
  return Linking.createURL("/auth/reset-password");
}

/** Alias for email confirmation — same deep link handler as OAuth callback. */
export function getEmailConfirmationRedirectTo(): string {
  return getOAuthRedirectTo();
}

/** URLs to try when finishing email links / OAuth from a cold or warm app launch. */
export async function gatherLinkingCandidateUrls(
  hookUrl: string | null | undefined,
): Promise<string[]> {
  const raw = [hookUrl, Linking.getLinkingURL(), await Linking.getInitialURL()].filter(
    (u): u is string => Boolean(u),
  );
  const seen = new Set<string>();
  const out: string[] = [];
  for (const u of raw) {
    if (seen.has(u)) continue;
    seen.add(u);
    out.push(u);
  }
  return out;
}
