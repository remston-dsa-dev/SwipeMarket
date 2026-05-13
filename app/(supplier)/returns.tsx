import { View } from "react-native";
import { useRouter } from "expo-router";
import { SupplierHeaderActions } from "@/components/SupplierHeaderActions";
import { PressableScale } from "@/components/PressableScale";
import { Screen } from "@/components/Screen";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/theme/ThemeContext";

export default function SupplierReturnsScreen() {
  const router = useRouter();
  const theme = useTheme();

  return (
    <Screen>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}>
          <PressableScale
            accessibilityLabel="Back"
            onPress={() => router.back()}
            style={{ paddingVertical: 8, paddingHorizontal: 4 }}
          >
            <ThemedText variant="label">← Back</ThemedText>
          </PressableScale>
          <ThemedText variant="headline" numberOfLines={1} style={{ flex: 1 }}>
            Returns
          </ThemedText>
        </View>
        <SupplierHeaderActions />
      </View>

      <View style={{ flex: 1, justifyContent: "center", gap: 12 }}>
        <ThemedText variant="headline">Returns</ThemedText>
        <ThemedText variant="body" color="muted">
          Track shopper returns, restock decisions, and refunds here. This section will connect to
          your returns workflow once the returns API is wired.
        </ThemedText>
        <PressableScale
          onPress={() => router.replace("/(supplier)/dashboard")}
          style={{
            alignSelf: "flex-start",
            marginTop: 8,
            paddingHorizontal: 18,
            paddingVertical: 12,
            borderRadius: theme.radius.md,
            backgroundColor: theme.colors.primary,
          }}
        >
          <ThemedText variant="label" color="onPrimary">
            Go to dashboard
          </ThemedText>
        </PressableScale>
      </View>
    </Screen>
  );
}
