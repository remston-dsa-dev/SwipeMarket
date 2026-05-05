import { useRouter } from "expo-router";
import { View } from "react-native";
import { PressableScale } from "@/components/PressableScale";
import { Screen } from "@/components/Screen";
import { ThemedText } from "@/components/ThemedText";
import { useSessionStore } from "@/stores/session-store";
import { useTheme } from "@/theme/ThemeContext";

export default function SupplierDashboardScreen() {
  const router = useRouter();
  const theme = useTheme();
  const clearSession = useSessionStore((s) => s.clearSession);

  return (
    <Screen>
      <View style={{ gap: 12, flex: 1 }}>
        <ThemedText variant="headline">Supplier hub</ThemedText>
        <ThemedText variant="body" color="muted">
          Listing creation with react-hook-form + zod and Supabase storage will
          plug in here.
        </ThemedText>
        <PressableScale
          accessibilityLabel="Sign out"
          onPress={() => {
            clearSession();
            router.replace("/sign-in");
          }}
          style={{
            alignSelf: "flex-start",
            marginTop: 8,
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderRadius: theme.radius.md,
            borderWidth: 1,
            borderColor: theme.colors.border,
          }}
        >
          <ThemedText variant="label">Sign out</ThemedText>
        </PressableScale>
      </View>
    </Screen>
  );
}
