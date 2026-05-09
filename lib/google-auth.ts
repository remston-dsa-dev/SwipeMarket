import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { isSupabaseConfigured } from "@/lib/is-supabase-configured";
import { supabase } from "@/lib/supabase";
import type { UserRole } from "@/stores/session-store";
import { useSessionStore } from "@/stores/session-store";

const PENDING_OAUTH_ROLE_KEY = "swipemarket-pending-oauth-role";

function extractOAuthParams(url: string): {
  code?: string;
  access_token?: string;
  refresh_token?: string;
  error?: string;
  error_description?: string;
} {
  const merged: Record<string, string> = {};
  const afterQuery = url.split("?")[1];
  const queryPart = afterQuery ? afterQuery.split("#")[0] : "";
  const hashPart = url.includes("#") ? url.split("#")[1] ?? "" : "";
  for (const part of [queryPart, hashPart]) {
    if (!part) continue;
    const params = new URLSearchParams(part);
    params.forEach((value, key) => {
      merged[key] = value;
    });
  }
  return {
    code: merged.code,
    access_token: merged.access_token,
    refresh_token: merged.refresh_token,
    error: merged.error,
    error_description: merged.error_description,
  };
}

async function establishSessionFromCallbackUrl(callbackUrl: string) {
  const { code, access_token, refresh_token, error, error_description } =
    extractOAuthParams(callbackUrl);

  if (error) {
    throw new Error(error_description || error);
  }

  if (code) {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) throw exchangeError;
    return;
  }

  if (access_token && refresh_token) {
    const { error: sessionError } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    });
    if (sessionError) throw sessionError;
    return;
  }

  throw new Error("Could not complete sign-in (missing authorization code).");
}

async function applyPendingSignupRole(userId: string) {
  const pending = await AsyncStorage.getItem(PENDING_OAUTH_ROLE_KEY);
  await AsyncStorage.removeItem(PENDING_OAUTH_ROLE_KEY);

  if (pending !== "supplier" && pending !== "customer") return;

  await supabase.from("profiles").update({ role: pending }).eq("id", userId);
}

/**
 * Google OAuth via Supabase. On Sign Up, pass `pendingSignupRole` so the profile role matches the selected card.
 * Configure Google provider + redirect URLs in Supabase Dashboard (Auth → Providers; URL Configuration).
 */
export async function signInWithGoogle(options?: {
  pendingSignupRole?: UserRole;
}): Promise<{ ok: true; role: UserRole } | { ok: false; reason: "cancelled" | "not_configured" }> {
  if (!isSupabaseConfigured()) {
    Alert.alert(
      "Supabase not configured",
      "Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to your .env file.",
    );
    return { ok: false, reason: "not_configured" };
  }

  if (options?.pendingSignupRole) {
    await AsyncStorage.setItem(PENDING_OAUTH_ROLE_KEY, options.pendingSignupRole);
  } else {
    await AsyncStorage.removeItem(PENDING_OAUTH_ROLE_KEY);
  }

  const redirectTo = Linking.createURL("/auth/callback");

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });

  if (error || !data?.url) {
    await AsyncStorage.removeItem(PENDING_OAUTH_ROLE_KEY);
    if (error) Alert.alert("Google sign-in failed", error.message);
    return { ok: false, reason: "cancelled" };
  }

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

  if (result.type !== "success" || !("url" in result) || !result.url) {
    await AsyncStorage.removeItem(PENDING_OAUTH_ROLE_KEY);
    return { ok: false, reason: "cancelled" };
  }

  try {
    await establishSessionFromCallbackUrl(result.url);
  } catch (e) {
    await AsyncStorage.removeItem(PENDING_OAUTH_ROLE_KEY);
    Alert.alert("Google sign-in failed", (e as Error).message);
    throw e;
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    await AsyncStorage.removeItem(PENDING_OAUTH_ROLE_KEY);
    Alert.alert("Google sign-in failed", "No session returned.");
    return { ok: false, reason: "cancelled" };
  }

  await applyPendingSignupRole(session.user.id);

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .maybeSingle();

  const role = (profile?.role === "supplier" ? "supplier" : "customer") as UserRole;
  useSessionStore.getState().setSession(session.user.id, role);

  return { ok: true, role };
}
