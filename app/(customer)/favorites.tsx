import { View } from "react-native";
import { useRouter } from "expo-router";
import { CustomerHeaderActions } from "@/components/CustomerHeaderActions";
import { FavoritesEmptyState } from "@/components/FavoritesEmptyState";
import { PressableScale } from "@/components/PressableScale";
import { Screen } from "@/components/Screen";
import { ThemedText } from "@/components/ThemedText";

export default function CustomerFavoritesScreen() {
  const router = useRouter();

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

      <FavoritesEmptyState onBrowseDiscover={() => router.replace("/(customer)/swipe")} />
    </Screen>
  );
}
