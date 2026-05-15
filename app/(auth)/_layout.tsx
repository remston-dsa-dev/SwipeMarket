import { Redirect, Stack } from "expo-router";
import { useShouldCelebrate } from "@/hooks/useShouldCelebrate";
import { HREF_ONBOARDING } from "@/lib/routes";
import { useSessionStore } from "@/stores/session-store";

export default function AuthLayout() {
  const authInitialized    = useSessionStore((s) => s.authInitialized);
  const userId             = useSessionStore((s) => s.userId);
  const role               = useSessionStore((s) => s.role);
  const onboardingComplete = useSessionStore((s) => s.onboardingComplete);
  const celebrate          = useShouldCelebrate();

  if (!authInitialized) return null;
  /* Hold rendering while we decide whether to celebrate; without this the
     user would see the onboarding/dashboard screen for a frame before
     bouncing to the welcome screen. */
  if (userId && celebrate === null) return null;
  if (userId && celebrate) return <Redirect href="/auth/welcome" />;
  if (userId && !onboardingComplete) return <Redirect href={HREF_ONBOARDING} />;
  if (userId && onboardingComplete && role === "supplier") return <Redirect href="/(supplier)/dashboard" />;
  if (userId && onboardingComplete && role === "customer") return <Redirect href="/(customer)/swipe" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
