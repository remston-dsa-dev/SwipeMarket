import * as Linking from "expo-linking";

/** Must be listed under Supabase → Authentication → URL Configuration → Redirect URLs. */
export function getOAuthRedirectTo(): string {
  return Linking.createURL("/auth/callback");
}
