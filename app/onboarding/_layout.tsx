import { ActivityIndicator, View } from "react-native";
import { Redirect, Stack } from "expo-router";
import { HREF_ONBOARDING } from "@/lib/routes";
import { useSessionStore } from "@/stores/session-store";
import { useTheme } from "@/theme/ThemeContext";

export default function OnboardingLayout() {
  const theme = useTheme();
  const authInitialized = useSessionStore((s) => s.authInitialized);
  const userId = useSessionStore((s) => s.userId);
  const onboardingComplete = useSessionStore((s) => s.onboardingComplete);
  const role = useSessionStore((s) => s.role);

  if (!authInitialized) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: theme.colors.background,
        }}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }
  if (!userId) return <Redirect href="/" />;
  if (onboardingComplete) {
    return <Redirect href={role === "supplier" ? "/(supplier)/dashboard" : "/(customer)/swipe"} />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
