import { Redirect, Stack } from "expo-router";
import { HREF_ONBOARDING } from "@/lib/routes";
import { useSessionStore } from "@/stores/session-store";

export default function CustomerLayout() {
  const authInitialized    = useSessionStore((s) => s.authInitialized);
  const userId             = useSessionStore((s) => s.userId);
  const role               = useSessionStore((s) => s.role);
  const onboardingComplete = useSessionStore((s) => s.onboardingComplete);

  if (!authInitialized) return null;
  if (!userId) return <Redirect href="/" />;
  if (!onboardingComplete) return <Redirect href={HREF_ONBOARDING} />;
  if (role !== "customer") return <Redirect href="/(supplier)/dashboard" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
