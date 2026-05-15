import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { Redirect } from "expo-router";
import * as Linking from "expo-linking";
import { gatherLinkingCandidateUrls } from "@/lib/auth-redirect";
import { completeOAuthSessionFromUrlList } from "@/lib/google-auth";
import {
  clearPendingVerification,
  getPendingVerification,
  hasEmailBeenCelebrated,
  hasUserBeenCelebrated,
} from "@/lib/pending-verification";
import { supabase } from "@/lib/supabase";

/* If the user confirms their email within this window, treat the visit as a
   first-time celebration. Covers the cross-device case where there's no local
   "pendingVerification" flag. */
const FRESH_CONFIRMATION_WINDOW_MS = 5 * 60 * 1000;

/**
 * OAuth + email confirmation redirect target. Session may already be completed
 * in-app via `WebBrowser.openAuthSessionAsync`; if the OS opens this route
 * first, we finish the exchange here.
 *
 * Possible outcomes — none of them ever leave the user stranded on a spinner:
 *   - Fresh email-confirmation sign-ups → `/auth/welcome` (confetti).
 *   - Returning Google sign-ins / sessions already set → `/`.
 *   - Link already consumed (very common in dev: Metro reloads keep replaying
 *     the same initial URL) → `/`. The root route guard takes it from there.
 *   - Hard error during exchange → still `/` so the user can sign in manually.
 */
export default function AuthCallbackScreen() {
  const hookUrl = Linking.useLinkingURL();
  const [destination, setDestination] = useState<"/" | "/auth/welcome" | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const urls = await gatherLinkingCandidateUrls(hookUrl);
        const exchange = await completeOAuthSessionFromUrlList(urls);
        if (!exchange.ok && exchange.reason === "error") {
          /* Hard, unexpected failure — log so it surfaces during dev, then
             continue to the redirect logic below. */
          console.warn("[auth] callback exchange failed:", exchange.message);
        }

        const celebrate = await shouldCelebrate();
        if (!cancelled) setDestination(celebrate ? "/auth/welcome" : "/");
      } catch (e) {
        /* Last-resort guard: anything else that escapes should still let the
           user out of the spinner. Without this, an uncaught error here
           freezes the screen. */
        console.warn("[auth] callback crashed:", (e as Error).message);
        if (!cancelled) setDestination("/");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hookUrl]);

  if (!destination) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0C0520" }}>
        <ActivityIndicator size="large" color="#A855F7" />
      </View>
    );
  }

  return <Redirect href={destination} />;
}

/**
 * Returns true when this callback hit looks like a brand-new email
 * confirmation. Same logic as the `useShouldCelebrate` hook — duplicated
 * here so the callback can decide its destination synchronously before the
 * upstream route guards re-run.
 */
async function shouldCelebrate(): Promise<boolean> {
  try {
    const [pending, sessionRes] = await Promise.all([
      getPendingVerification(),
      supabase.auth.getSession(),
    ]);
    const user = sessionRes.data.session?.user;
    if (!user) return false;

    /* One-shot: if this user has already seen the welcome screen, the
       upstream guards will route them onward normally. Check both userId
       and email since the welcome screen marks both. */
    if (await hasUserBeenCelebrated(user.id)) return false;
    const userEmail = (user.email ?? "").trim().toLowerCase();
    if (userEmail && (await hasEmailBeenCelebrated(userEmail))) return false;

    const sameDevice =
      !!pending &&
      pending.email === userEmail;

    const confirmedAt = user.email_confirmed_at
      ? Date.parse(user.email_confirmed_at)
      : NaN;
    const fresh =
      Number.isFinite(confirmedAt) &&
      Date.now() - confirmedAt < FRESH_CONFIRMATION_WINDOW_MS;

    if (sameDevice || fresh) {
      /* Welcome screen also clears, but doing it here protects against the
         user navigating back/away before the welcome screen mounts. */
      await clearPendingVerification();
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
