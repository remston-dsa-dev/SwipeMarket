import { Redirect, Stack } from "expo-router";
import { useSessionStore } from "@/stores/session-store";

export default function AuthLayout() {
  const authInitialized = useSessionStore((s) => s.authInitialized);
  const userId          = useSessionStore((s) => s.userId);
  const role            = useSessionStore((s) => s.role);

  if (!authInitialized) return null;
  if (userId && role === "supplier") return <Redirect href="/(supplier)/dashboard" />;
  if (userId && role === "customer") return <Redirect href="/(customer)/swipe" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
