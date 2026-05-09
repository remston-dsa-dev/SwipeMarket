import { Redirect, Stack } from "expo-router";
import { useSessionStore } from "@/stores/session-store";

export default function SupplierLayout() {
  const authInitialized = useSessionStore((s) => s.authInitialized);
  const userId          = useSessionStore((s) => s.userId);
  const role            = useSessionStore((s) => s.role);

  if (!authInitialized) return null;
  if (!userId) return <Redirect href="/" />;
  if (role !== "supplier") return <Redirect href="/(customer)/swipe" />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="add-product" options={{ presentation: "modal" }} />
    </Stack>
  );
}
