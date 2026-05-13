import { View } from "react-native";
import { useRouter } from "expo-router";
import { CustomerHeaderActions } from "@/components/CustomerHeaderActions";
import { PressableScale } from "@/components/PressableScale";
import { Screen } from "@/components/Screen";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/theme/ThemeContext";

const PLACEHOLDER_LINKS = [
  { title: "Saved addresses", body: "Shipping defaults for faster checkout." },
  { title: "Notifications", body: "Order updates, deals, and partner messages." },
  { title: "Payment methods", body: "Cards and wallets for checkout." },
] as const;

export default function CustomerMoreScreen() {
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
            More
          </ThemedText>
        </View>
        <CustomerHeaderActions />
      </View>

      <ThemedText variant="body" color="muted" style={{ marginBottom: 20 }}>
        Account extras and preferences will live here. Preview of planned areas:
      </ThemedText>

      <View style={{ gap: 12 }}>
        {PLACEHOLDER_LINKS.map((row) => (
          <View
            key={row.title}
            style={{
              padding: 16,
              borderRadius: theme.radius.lg,
              borderWidth: 1,
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.surface,
              gap: 6,
            }}
          >
            <ThemedText variant="label">{row.title}</ThemedText>
            <ThemedText variant="caption" color="muted">
              {row.body}
            </ThemedText>
            <ThemedText variant="caption" color="secondary">
              Coming soon
            </ThemedText>
          </View>
        ))}
      </View>
    </Screen>
  );
}
