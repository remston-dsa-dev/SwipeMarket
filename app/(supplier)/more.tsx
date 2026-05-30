import { View } from "react-native";
import { SupplierHeaderActions } from "@/components/SupplierHeaderActions";
import { PressableScale } from "@/components/PressableScale";
import { Screen } from "@/components/Screen";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/theme/ThemeContext";

const PLACEHOLDER_LINKS = [
  { title: "Business profile", body: "Store details, tax IDs, and payout preferences." },
  { title: "Notifications", body: "Order alerts, low stock, and shopper messages." },
  { title: "Integrations", body: "Shipping labels, accounting, and webhooks." },
] as const;

export default function SupplierMoreScreen() {
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
        <SupplierHeaderActions />
      </View>

      <ThemedText variant="body" color="muted" style={{ marginBottom: 20 }}>
        Extra partner tools and settings will live here. Below is a preview of planned areas.
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
