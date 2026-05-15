import { Alert } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { getOAuthRedirectTo, getPasswordRecoveryRedirectTo } from "@/lib/auth-redirect";
import {
  getSupabaseUrlMisconfigurationMessage,
  isSupabaseConfigured,
} from "@/lib/is-supabase-configured";
import { fetchProfileRoleAndOnboarding } from "@/lib/profile-onboarding";
import { supabase } from "@/lib/supabase";
import type { UserRole } from "@/stores/session-store";
import { useSessionStore } from "@/stores/session-store";

function extractAuthUrlParams(url: string): {
  code?: string;
  access_token?: string;
  refresh_token?: string;
  token_hash?: string;
  type?: string;
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
    token_hash: merged.token_hash,
    type: merged.type,
    error: merged.error,
    error_description: merged.error_description,
  };
}

const VERIFY_OTP_TYPES = new Set([
  "signup",
  "email",
  "recovery",
  "invite",
  "magiclink",
  "email_change",
]);

export async function establishSessionFromCallbackUrl(callbackUrl: string) {
  const { code, access_token, refresh_token, token_hash, type, error, error_description } =
    extractAuthUrlParams(callbackUrl);

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

  if (token_hash && type && VERIFY_OTP_TYPES.has(type)) {
    const { error: otpError } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as "signup" | "email" | "recovery" | "invite" | "magiclink" | "email_change",
    });
    if (otpError) throw otpError;
    return;
  }

  throw new Error("Could not complete sign-in (missing or invalid link parameters).");
}

const AUTH_DEEP_LINK_HINT =
  /(?:^|[?#])(?:code|access_token|refresh_token|token_hash|error)=/;

/**
 * Supabase responds with these messages when a verification / OAuth link has
 * already been redeemed or has aged out. They're expected during dev hot
 * reloads (where the same initial URL keeps replaying) and on legitimate
 * second-click scenarios. We surface them as a recoverable `{ ok: false }`
 * rather than throwing so callers can render a friendly UX.
 */
const CONSUMED_LINK_PATTERNS = [
  "email link is invalid",
  "email link has expired",
  "invalid or has expired",
  "otp_expired",
  "access_denied",
  "code verifier",
  "pkce",
];

function isConsumedOrExpiredLinkError(message: string): boolean {
  const lower = message.toLowerCase();
  return CONSUMED_LINK_PATTERNS.some((p) => lower.includes(p));
}

export type CompleteSessionResult =
  | { ok: true; skipped?: "no_payload" | "already_signed_in" }
  | { ok: false; reason: "consumed_or_expired" | "error"; message: string };

/**
 * Completes OAuth when the app is opened on the redirect URL (e.g. `/auth/callback`)
 * before or alongside `WebBrowser.openAuthSessionAsync`. Safe to call multiple
 * times — it short-circuits when there's no auth payload, when a session
 * already exists, or when the link has already been consumed/expired (a
 * common case in dev where the initial URL replays on every Metro reload).
 */
export async function completeOAuthSessionFromUrlIfNeeded(
  url: string | null | undefined,
): Promise<CompleteSessionResult> {
  if (!url || !AUTH_DEEP_LINK_HINT.test(url)) {
    return { ok: true, skipped: "no_payload" };
  }

  const {
    data: { session: existing },
  } = await supabase.auth.getSession();
  if (existing) return { ok: true, skipped: "already_signed_in" };

  try {
    await establishSessionFromCallbackUrl(url);
    return { ok: true };
  } catch (e) {
    const message = (e as Error).message ?? "Unknown error";
    if (isConsumedOrExpiredLinkError(message)) {
      return { ok: false, reason: "consumed_or_expired", message };
    }
    return { ok: false, reason: "error", message };
  }
}

export function urlLooksLikeAuthRedirect(url: string | null | undefined): boolean {
  return !!url && AUTH_DEEP_LINK_HINT.test(url);
}

/**
 * Runs {@link completeOAuthSessionFromUrlIfNeeded} for each unique URL (e.g.
 * callback + initial link). Returns the first non-skipped outcome so callers
 * can decide whether to celebrate, retry, or surface an error.
 */
export async function completeOAuthSessionFromUrlList(
  urls: string[],
): Promise<CompleteSessionResult> {
  let lastSkip: CompleteSessionResult = { ok: true, skipped: "no_payload" };
  for (const u of urls) {
    const res = await completeOAuthSessionFromUrlIfNeeded(u);
    /* Successful exchange or an actual failure → stop looking. We only keep
       iterating while everything is being skipped (no payload / already
       signed in). */
    if (!res.ok || (res.ok && !res.skipped)) return res;
    lastSkip = res;
  }
  return lastSkip;
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
    console.info("[auth] Supabase Redirect URLs — OAuth + email confirm:", redirectTo);
    console.info("[auth] Supabase Redirect URLs — password reset:", getPasswordRecoveryRedirectTo());
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
