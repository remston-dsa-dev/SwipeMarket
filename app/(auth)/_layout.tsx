import { Redirect, Stack } from "expo-router";
import { HREF_ONBOARDING } from "@/lib/routes";
import { useSessionStore } from "@/stores/session-store";

export default function AuthLayout() {
  const authInitialized    = useSessionStore((s) => s.authInitialized);
  const userId             = useSessionStore((s) => s.userId);
  const role               = useSessionStore((s) => s.role);
  const onboardingComplete = useSessionStore((s) => s.onboardingComplete);

  if (!authInitialized) return null;
  if (userId && !onboardingComplete) return <Redirect href={HREF_ONBOARDING} />;
  if (userId && onboardingComplete && role === "supplier") return <Redirect href="/(supplier)/dashboard" />;
  if (userId && onboardingComplete && role === "customer") return <Redirect href="/(customer)/swipe" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
