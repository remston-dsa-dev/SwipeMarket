import { Redirect } from "expo-router";
import { useSessionStore } from "@/stores/session-store";

export default function Index() {
  const userId = useSessionStore((s) => s.userId);
  const role = useSessionStore((s) => s.role);

  if (!userId) {
    return <Redirect href="/sign-in" />;
  }
  if (role === "supplier") {
    return <Redirect href="/dashboard" />;
  }
  return <Redirect href="/swipe" />;
}
