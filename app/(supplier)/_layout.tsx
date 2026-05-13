import { Redirect, Stack } from "expo-router";
import { HREF_ONBOARDING } from "@/lib/routes";
import { useSessionStore } from "@/stores/session-store";

export default function SupplierLayout() {
  const authInitialized    = useSessionStore((s) => s.authInitialized);
  const userId             = useSessionStore((s) => s.userId);
  const role               = useSessionStore((s) => s.role);
  const onboardingComplete = useSessionStore((s) => s.onboardingComplete);

  if (!authInitialized) return null;
  if (!userId) return <Redirect href="/" />;
  if (!onboardingComplete) return <Redirect href={HREF_ONBOARDING} />;
  if (role !== "supplier") return <Redirect href="/(customer)/swipe" />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="orders" />
      <Stack.Screen name="returns" />
      <Stack.Screen name="more" />
      <Stack.Screen name="add-product" options={{ presentation: "modal" }} />
    </Stack>
  );
}
