import { View } from "react-native";
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
        <ThemedText variant="headline" numberOfLines={1} style={{ flex: 1 }}>
          More
        </ThemedText>
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
