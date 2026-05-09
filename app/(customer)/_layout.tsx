import { Redirect, Stack } from "expo-router";
import { useSessionStore } from "@/stores/session-store";

export default function CustomerLayout() {
  const authInitialized = useSessionStore((s) => s.authInitialized);
  const userId          = useSessionStore((s) => s.userId);
  const role            = useSessionStore((s) => s.role);

  if (!authInitialized) return null;
  if (!userId) return <Redirect href="/" />;
  if (role !== "customer") return <Redirect href="/(supplier)/dashboard" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
