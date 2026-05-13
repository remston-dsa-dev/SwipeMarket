import { Alert } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { getOAuthRedirectTo } from "@/lib/auth-redirect";
import {
  getSupabaseUrlMisconfigurationMessage,
  isSupabaseConfigured,
} from "@/lib/is-supabase-configured";
import { fetchProfileRoleAndOnboarding } from "@/lib/profile-onboarding";
import { supabase } from "@/lib/supabase";
import type { UserRole } from "@/stores/session-store";
import { useSessionStore } from "@/stores/session-store";

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

export async function establishSessionFromCallbackUrl(callbackUrl: string) {
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

const OAUTH_URL_HINT = /(?:^|[?#])(?:code|access_token|refresh_token|error)=/;

/**
 * Completes OAuth when the app is opened on the redirect URL (e.g. `/auth/callback`)
 * before or alongside `WebBrowser.openAuthSessionAsync`. Safe to call multiple times:
 * skips if a session already exists, or if the URL has no OAuth payload.
 */
export async function completeOAuthSessionFromUrlIfNeeded(
  url: string | null | undefined,
): Promise<void> {
  if (!url || !OAUTH_URL_HINT.test(url)) return;

  const {
    data: { session: existing },
  } = await supabase.auth.getSession();
  if (existing) return;

  await establishSessionFromCallbackUrl(url);
}

/**
 * Google OAuth via Supabase.
 * Configure Google provider + redirect URLs in Supabase Dashboard (Auth → Providers; URL Configuration).
 */
export async function signInWithGoogle(): Promise<
  { ok: true; role: UserRole } | { ok: false; reason: "cancelled" | "not_configured" }
> {
  if (!isSupabaseConfigured()) {
    Alert.alert(
      "Supabase not configured",
      "Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to your .env file.",
    );
    return { ok: false, reason: "not_configured" };
  }

  const urlMisconfig = getSupabaseUrlMisconfigurationMessage();
  if (urlMisconfig) {
    Alert.alert("Wrong Supabase URL", urlMisconfig);
    return { ok: false, reason: "not_configured" };
  }

  const redirectTo = getOAuthRedirectTo();
  if (__DEV__) {
    console.info("[auth] Supabase Redirect URLs must include:", redirectTo);
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });

  if (error || !data?.url) {
    if (error) Alert.alert("Google sign-in failed", error.message);
    return { ok: false, reason: "cancelled" };
  }

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

  if (result.type !== "success" || !("url" in result) || !result.url) {
    return { ok: false, reason: "cancelled" };
  }

  try {
    const {
      data: { session: existing },
    } = await supabase.auth.getSession();
    if (!existing) {
      await establishSessionFromCallbackUrl(result.url);
    }
  } catch (e) {
    Alert.alert("Google sign-in failed", (e as Error).message);
    throw e;
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    Alert.alert("Google sign-in failed", "No session returned.");
    return { ok: false, reason: "cancelled" };
  }

  const { role, onboardingComplete } = await fetchProfileRoleAndOnboarding(session.user.id);
  useSessionStore.getState().setSession(session.user.id, role, onboardingComplete);

  return { ok: true, role };
}
