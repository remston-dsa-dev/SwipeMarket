import { getExtra } from "@/lib/env";

/** True when real Supabase URL and anon key are set via app.config / .env (not placeholders). */
export function isSupabaseConfigured(): boolean {
  const { supabaseUrl, supabaseAnonKey } = getExtra();
  return (
    supabaseUrl.length > 0 &&
    supabaseAnonKey.length > 0 &&
    !supabaseUrl.includes("placeholder") &&
    supabaseAnonKey !== "placeholder-anon-key"
  );
}

/**
 * When users paste the dashboard URL, OAuth opens supabase.com and returns 404.
 * API URL must be https://<project-ref>.supabase.co (Project Settings → API).
 */
export function getSupabaseUrlMisconfigurationMessage(): string | null {
  const { supabaseUrl } = getExtra();
  const trimmed = supabaseUrl.trim();
  if (!trimmed) return null;
  if (trimmed.includes("supabase.com/dashboard")) {
    return "EXPO_PUBLIC_SUPABASE_URL looks like a dashboard link. Use your project API URL from Project Settings → API, for example https://abcd1234.supabase.co (not supabase.com/dashboard/...).";
  }
  try {
    const host = new URL(trimmed).hostname;
    if (host === "supabase.com" || host === "www.supabase.com") {
      return "EXPO_PUBLIC_SUPABASE_URL must be https://YOUR-PROJECT-REF.supabase.co, not supabase.com.";
    }
  } catch {
    return null;
  }
  return null;
}
