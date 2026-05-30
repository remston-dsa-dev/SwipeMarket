import { View } from "react-native";
import { useRouter } from "expo-router";
import { CustomerHeaderActions } from "@/components/CustomerHeaderActions";
import { FavoritesEmptyState } from "@/components/FavoritesEmptyState";
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
        <ThemedText variant="headline" numberOfLines={1} style={{ flex: 1 }}>
          Favorites
        </ThemedText>
        <CustomerHeaderActions />
      </View>

      <FavoritesEmptyState onBrowseDiscover={() => router.replace("/(customer)/swipe")} />
    </Screen>
  );
}
