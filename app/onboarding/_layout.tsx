import { Redirect, Stack } from "expo-router";
import { useSessionStore } from "@/stores/session-store";

export default function OnboardingLayout() {
  const authInitialized = useSessionStore((s) => s.authInitialized);
  const userId = useSessionStore((s) => s.userId);
  const onboardingComplete = useSessionStore((s) => s.onboardingComplete);
  const role = useSessionStore((s) => s.role);

  if (!authInitialized) return null;
  if (!userId) return <Redirect href="/" />;
  if (onboardingComplete) {
    return <Redirect href={role === "supplier" ? "/(supplier)/dashboard" : "/(customer)/swipe"} />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
