import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Tracks a sign-up that's waiting for the email confirmation link to be
 * clicked. Used to:
 *   1) reopen the "Verify your email" sheet on app return,
 *   2) route the user to the celebration screen on first confirmation
 *      instead of dropping them on the regular home flow silently.
 *
 * Cross-device confirmations won't hit this flag (it's local-only), but
 * the callback also has a recency check on `email_confirmed_at` for that
 * case.
 */
const PENDING_VERIFICATION_KEY = "swipemarket_pending_verification";

/**
 * Marks an account as "already celebrated" so the welcome screen never plays
 * twice for the same account, even when the recency window on
 * `email_confirmed_at` would otherwise still match.
 *
 * Two keys, deliberately:
 *   - `…_user_id` is set when we know the Supabase userId (deep-link case).
 *   - `…_email`   is set when we only know the email (the user came back
 *     from their mail app and we're about to send them through the
 *     welcome → sign-in flow without an active session).
 * The hook checks both so neither path bounces the user back to welcome
 * after they finally sign in.
 */
const CELEBRATED_USER_KEY  = "swipemarket_celebrated_user_id";
const CELEBRATED_EMAIL_KEY = "swipemarket_celebrated_email";

export type PendingVerification = {
  email: string;
  /** epoch ms — used to expire stale entries after a few days. */
  ts: number;
};

/** Records that the user just signed up and is waiting on email confirmation. */
export async function setPendingVerification(email: string): Promise<void> {
  try {
    const payload: PendingVerification = {
      email: email.trim().toLowerCase(),
      ts: Date.now(),
    };
    await AsyncStorage.setItem(PENDING_VERIFICATION_KEY, JSON.stringify(payload));
  } catch {
    /* ignore */
  }
}

const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function getPendingVerification(): Promise<PendingVerification | null> {
  try {
    const raw = await AsyncStorage.getItem(PENDING_VERIFICATION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingVerification;
    if (
      !parsed ||
      typeof parsed.email !== "string" ||
      typeof parsed.ts !== "number" ||
      Date.now() - parsed.ts > MAX_AGE_MS
    ) {
      await AsyncStorage.removeItem(PENDING_VERIFICATION_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function clearPendingVerification(): Promise<void> {
  try {
    await AsyncStorage.removeItem(PENDING_VERIFICATION_KEY);
  } catch {
    /* ignore */
  }
}

export async function markUserCelebrated(userId: string): Promise<void> {
  try {
    await AsyncStorage.setItem(CELEBRATED_USER_KEY, userId);
  } catch {
    /* ignore */
  }
}

export async function hasUserBeenCelebrated(userId: string): Promise<boolean> {
  try {
    const stored = await AsyncStorage.getItem(CELEBRATED_USER_KEY);
    return stored === userId;
  } catch {
    return false;
  }
}

export async function markEmailCelebrated(email: string): Promise<void> {
  try {
    await AsyncStorage.setItem(
      CELEBRATED_EMAIL_KEY,
      email.trim().toLowerCase(),
    );
  } catch {
    /* ignore */
  }
}

export async function hasEmailBeenCelebrated(email: string): Promise<boolean> {
  try {
    const stored = await AsyncStorage.getItem(CELEBRATED_EMAIL_KEY);
    return stored === email.trim().toLowerCase();
  } catch {
    return false;
  }
}
