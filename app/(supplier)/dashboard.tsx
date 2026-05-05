import { FlatList, View } from "react-native";
import { useRouter } from "expo-router";
import { PressableScale } from "@/components/PressableScale";
import { ProductRow } from "@/components/ProductRow";
import { Screen } from "@/components/Screen";
import { ThemedText } from "@/components/ThemedText";
import { useInventoryStore } from "@/stores/inventory-store";
import { useSessionStore } from "@/stores/session-store";
import { useTheme } from "@/theme/ThemeContext";

export default function SupplierDashboardScreen() {
  const router = useRouter();
  const theme = useTheme();
  const clearSession = useSessionStore((s) => s.clearSession);
  const products = useInventoryStore((s) => s.products);

  const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
  const totalValue = products.reduce(
    (sum, p) => sum + p.stock * p.unitPriceCents,
    0,
  );

  return (
    <Screen>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <View style={{ gap: 4 }}>
          <ThemedText variant="headline">Inventory</ThemedText>
          <ThemedText variant="caption" color="muted">
            {products.length} product{products.length !== 1 ? "s" : ""} ·{" "}
            {totalStock} units · ${(totalValue / 100).toFixed(0)} value
          </ThemedText>
        </View>

        <PressableScale
          accessibilityLabel="Sign out"
          onPress={() => {
            clearSession();
            router.replace("/sign-in");
          }}
          style={{
            paddingHorizontal: 12,
            paddingVertical: 7,
            borderRadius: theme.radius.sm,
            borderWidth: 1,
            borderColor: theme.colors.border,
          }}
        >
          <ThemedText variant="caption">Sign out</ThemedText>
        </PressableScale>
      </View>

      {/* Add product button */}
      <PressableScale
        accessibilityLabel="Add new product"
        onPress={() => router.push("/(supplier)/add-product")}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          paddingVertical: 14,
          borderRadius: theme.radius.md,
          backgroundColor: theme.colors.primary,
          marginBottom: 16,
        }}
      >
        <ThemedText variant="label" color="onPrimary">
          + New Product
        </ThemedText>
      </PressableScale>

      {products.length === 0 ? (
        <View style={{ flex: 1, justifyContent: "center", gap: 12 }}>
          <ThemedText variant="headline">No products yet</ThemedText>
          <ThemedText variant="body" color="muted">
            Tap "New Product" to add your first listing. Customers will see it
            in their swipe deck immediately.
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(p) => p.id}
          renderItem={({ item }) => <ProductRow product={item} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </Screen>
  );
}
