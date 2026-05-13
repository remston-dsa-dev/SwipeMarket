import { Redirect, Stack } from "expo-router";
import { useEffect } from "react";
import { fetchMyCartLines } from "@/lib/cart-remote";
import { isSupabaseConfigured } from "@/lib/is-supabase-configured";
import { HREF_ONBOARDING } from "@/lib/routes";
import { useCartStore } from "@/stores/cart-store";
import { useSessionStore } from "@/stores/session-store";

export default function CustomerLayout() {
  const authInitialized = useSessionStore((s) => s.authInitialized);
  const userId = useSessionStore((s) => s.userId);
  const role = useSessionStore((s) => s.role);
  const onboardingComplete = useSessionStore((s) => s.onboardingComplete);

  useEffect(() => {
    if (!userId || role !== "customer" || !isSupabaseConfigured()) return;
    void (async () => {
      try {
        const lines = await fetchMyCartLines();
        useCartStore.getState().replaceFromServer(lines);
      } catch {
        /* keep persisted cart if sync fails */
      }
    })();
  }, [userId, role]);

  if (!authInitialized) return null;
  if (!userId) return <Redirect href="/" />;
  if (!onboardingComplete) return <Redirect href={HREF_ONBOARDING} />;
  if (role !== "customer") return <Redirect href="/(supplier)/dashboard" />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="swipe" />
      <Stack.Screen name="matches" />
      <Stack.Screen name="orders" />
      <Stack.Screen name="more" />
    </Stack>
  );
}
