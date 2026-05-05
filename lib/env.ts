import Constants from "expo-constants";

export type AppExtra = {
  supabaseUrl: string;
  supabaseAnonKey: string;
  stripePublishableKey: string;
  socketUrl: string;
};

export function getExtra(): AppExtra {
  const extra = Constants.expoConfig?.extra as Partial<AppExtra> | undefined;
  return {
    supabaseUrl: extra?.supabaseUrl ?? "",
    supabaseAnonKey: extra?.supabaseAnonKey ?? "",
    stripePublishableKey: extra?.stripePublishableKey ?? "",
    socketUrl: extra?.socketUrl ?? "",
  };
}
