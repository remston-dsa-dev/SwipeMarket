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
