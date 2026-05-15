import type { ReactNode } from "react";
import { useEffect } from "react";
import { AppState, type AppStateStatus } from "react-native";
import * as Linking from "expo-linking";
import { syncSessionFromSupabaseAuth } from "@/lib/auth-session";
import {
  completeOAuthSessionFromUrlIfNeeded,
  urlLooksLikeAuthRedirect,
} from "@/lib/google-auth";
import { isSupabaseConfigured } from "@/lib/is-supabase-configured";
import { supabase } from "@/lib/supabase";
import { useSessionStore } from "@/stores/session-store";

export function AuthProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const store = useSessionStore.getState();

    if (!isSupabaseConfigured()) {
      store.clearSession();
      store.setAuthInitialized(true);
      return;
    }

    let cancelled = false;

    async function apply(session: Parameters<typeof syncSessionFromSupabaseAuth>[0]) {
      await syncSessionFromSupabaseAuth(session);
      if (!cancelled) store.setAuthInitialized(true);
    }

    void supabase.auth.getSession().then(({ data }) => apply(data.session));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      void apply(session);
    });

    /* In dev (Expo Go) and occasionally in production cold-starts, a verify
       email link can land the app on `/` instead of `/auth/callback`, which
       leaves the OAuth payload unprocessed. To make the flow resilient,
       listen for any incoming Linking URL globally and complete the session
       exchange if it carries an auth payload. The exchange function is a
       no-op when a session already exists, so this is safe to run alongside
       the dedicated callback screen.

       NOTE: `Linking.getInitialURL()` keeps returning the same URL across
       Metro reloads in dev. After the first successful exchange the link
       gets consumed by Supabase, so subsequent replays return a
       "consumed_or_expired" result. We treat that as a no-op rather than an
       error since the user is already signed in (or signing in elsewhere). */
    async function maybeCompleteFromUrl(url: string | null | undefined) {
      if (!urlLooksLikeAuthRedirect(url)) return;
      const res = await completeOAuthSessionFromUrlIfNeeded(url);
      if (!res.ok && res.reason === "error") {
        console.warn("[auth] failed to complete session from deep link", res.message);
      }
    }

    void Linking.getInitialURL().then(maybeCompleteFromUrl);
    const linkingSub = Linking.addEventListener("url", ({ url }) => {
      void maybeCompleteFromUrl(url);
    });

    /* If the user backgrounds the app to confirm their email and returns,
       the deep link may already have fired before we subscribed — or never
       fired at all (some mail clients show a success page instead of opening
       the app). Either way, a session may now exist on the device that our
       in-memory state doesn't reflect yet. Refresh on foreground so the
       welcome-screen guards re-evaluate. */
    const appStateSub = AppState.addEventListener("change", (next: AppStateStatus) => {
      if (next !== "active") return;
      void supabase.auth.getSession().then(({ data }) => apply(data.session));
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      linkingSub.remove();
      appStateSub.remove();
    };
  }, []);

  return children;
}
