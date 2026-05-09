import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { getExtra } from "@/lib/env";

const { supabaseUrl, supabaseAnonKey } = getExtra();

const url =
  supabaseUrl.length > 0 ? supabaseUrl : "https://placeholder.supabase.co";
const key =
  supabaseAnonKey.length > 0 ? supabaseAnonKey : "placeholder-anon-key";

export const supabase = createClient(url, key, {
  auth: {
    storage: AsyncStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
