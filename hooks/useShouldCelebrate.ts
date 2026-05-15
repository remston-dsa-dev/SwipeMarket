import { useEffect, useState } from "react";
import {
  getPendingVerification,
  hasEmailBeenCelebrated,
  hasUserBeenCelebrated,
} from "@/lib/pending-verification";
import { supabase } from "@/lib/supabase";
import { useSessionStore } from "@/stores/session-store";

/* User confirmed their email in the last few minutes → treat the next session
   establishment as a "fresh confirmation" worth celebrating, even without the
   local pending-verification flag (cross-device case). */
const FRESH_CONFIRMATION_WINDOW_MS = 5 * 60 * 1000;

/**
 * Returns `true` when the just-established session looks like a brand-new
 * email confirmation — i.e. the user should see the welcome/confetti screen
 * before being routed to onboarding or the main app.
 *
 * Two independent signals are used so this works regardless of which screen
 * caught the deep link:
 *   1. A local "pendingVerification" flag set during sign-up on this device,
 *      matching the now-authenticated user's email.
 *   2. The Supabase user's `email_confirmed_at` timestamp is within the last
 *      few minutes (covers cross-device confirmations or lost deep links).
 *
 * Returns `null` while the answer is still being resolved, so route guards
 * can hold off on redirecting until the decision is made.
 */
export function useShouldCelebrate(): boolean | null {
  const userId = useSessionStore((s) => s.userId);
  const [decision, setDecision] = useState<boolean | null>(null);

  useEffect(() => {
    /* No session → not celebrating. The decision is "false" rather than
       null so guards can proceed immediately. */
    if (!userId) {
      setDecision(false);
      return undefined;
    }

    let cancelled = false;
    /* Resolving the celebration decision touches AsyncStorage + a Supabase
       getSession call. Until both return we leave the decision null so the
       layout shows a neutral loading state rather than flashing the wrong
       destination. */
    setDecision(null);

    (async () => {
      try {
        const [pending, sessionRes, userCelebrated] = await Promise.all([
          getPendingVerification(),
          supabase.auth.getSession(),
          hasUserBeenCelebrated(userId),
        ]);
        if (cancelled) return;

        if (userCelebrated) {
          setDecision(false);
          return;
        }

        const user = sessionRes.data.session?.user;
        if (!user) {
          setDecision(false);
          return;
        }

        const email = (user.email ?? "").trim().toLowerCase();

        /* Also short-circuit when the welcome screen has already played for
           this email (the more common case in our deterministic flow: the
           welcome screen signs the user out before they sign in for real,
           so we can't rely on the userId alone). */
        if (email && (await hasEmailBeenCelebrated(email))) {
          setDecision(false);
          return;
        }

        const sameDevice = !!pending && pending.email === email;

        const confirmedAt = user.email_confirmed_at
          ? Date.parse(user.email_confirmed_at)
          : NaN;
        const fresh =
          Number.isFinite(confirmedAt) &&
          Date.now() - confirmedAt < FRESH_CONFIRMATION_WINDOW_MS;

        setDecision(sameDevice || fresh);
      } catch {
        if (!cancelled) setDecision(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  return decision;
}
