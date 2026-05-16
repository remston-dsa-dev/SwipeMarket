import { View } from "react-native";
import { useRouter } from "expo-router";
import { CustomerHeaderActions } from "@/components/CustomerHeaderActions";
import { PressableScale } from "@/components/PressableScale";
import { Screen } from "@/components/Screen";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/theme/ThemeContext";

export default function CustomerFavoritesScreen() {
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
            Favorites
          </ThemedText>
        </View>
        <CustomerHeaderActions />
      </View>

      <View style={{ flex: 1, justifyContent: "center", gap: 12 }}>
        <ThemedText variant="body" color="muted">
          Saved listings and brands you follow will show up here when favorites are wired to your
          account.
        </ThemedText>
        <PressableScale
          onPress={() => router.push("/(customer)/swipe")}
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
            Browse Discover
          </ThemedText>
        </PressableScale>
      </View>
    </Screen>
  );
}
