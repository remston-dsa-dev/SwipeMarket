import { View } from "react-native";
import { Image } from "expo-image";
import { PressableScale } from "@/components/PressableScale";
import { ThemedText } from "@/components/ThemedText";
import { useCartStore } from "@/stores/cart-store";
import { useTheme } from "@/theme/ThemeContext";
import { useInventoryStore } from "@/stores/inventory-store";
import type { Product } from "@/types/product";

type Props = {
  product: Product;
};

function stockColor(stock: number): string {
  if (stock >= 10) return "#22C55E";
  if (stock >= 3) return "#F59E0B";
  return "#EF4444";
}

export function ProductRow({ product }: Props) {
  const theme = useTheme();
  const adjustStock = useInventoryStore((s) => s.adjustStock);
  const removeProduct = useInventoryStore((s) => s.removeProduct);
  const cartItems = useCartStore((s) => s.items);
  const qtyOnHold = cartItems
    .filter((item) => item.listingId === product.id)
    .reduce((sum, item) => sum + item.qty, 0);
  const qtyAllocated = product.qtyAllocated ?? 0;
  const qtyAvailable = Math.max(0, product.stock - qtyOnHold);
  const color = stockColor(product.stock);

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
      }}
    >
      <Image
        source={{ uri: product.imageUrl }}
        style={{ width: 56, height: 56, borderRadius: theme.radius.sm }}
        contentFit="cover"
        accessibilityLabel={product.title}
      />

      <View style={{ flex: 1, gap: 3 }}>
        <ThemedText variant="label" numberOfLines={1}>
          {product.title}
        </ThemedText>
        <ThemedText variant="caption" color="secondary">
          {product.priceLabel}
        </ThemedText>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: color,
            }}
          />
          <ThemedText variant="caption" style={{ color }}>
            Qty Available: {qtyAvailable}
          </ThemedText>
          <ThemedText variant="caption" color="muted">
            Qty On Hold: {qtyOnHold}
          </ThemedText>
          <ThemedText variant="caption" color="muted">
            Qty Allocated: {qtyAllocated}
          </ThemedText>
        </View>
      </View>

      {/* Stock adjust */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <PressableScale
          accessibilityLabel="Decrease stock"
          onPress={() => {
            if (qtyAvailable <= 0) return;
            adjustStock(product.id, -1);
          }}
          style={[
            stockBtnStyle,
            {
              borderColor:
                qtyAvailable === 0 ? theme.colors.border : theme.colors.primary,
            },
          ]}
        >
          <ThemedText
            variant="caption"
            style={{
              color:
                qtyAvailable === 0
                  ? theme.colors.textSecondary
                  : theme.colors.primary,
              fontWeight: "700",
            }}
          >
            −
          </ThemedText>
        </PressableScale>

        <ThemedText
          variant="caption"
          style={{ minWidth: 22, textAlign: "center", fontWeight: "700" }}
        >
          {qtyAvailable}
        </ThemedText>

        <PressableScale
          accessibilityLabel="Increase stock"
          onPress={() => adjustStock(product.id, 1)}
          style={[stockBtnStyle, { borderColor: theme.colors.primary }]}
        >
          <ThemedText
            variant="caption"
            style={{ color: theme.colors.primary, fontWeight: "700" }}
          >
            +
          </ThemedText>
        </PressableScale>
      </View>

      {/* Delete */}
      <PressableScale
        accessibilityLabel={`Delete ${product.title}`}
        onPress={() => removeProduct(product.id)}
        style={{
          paddingHorizontal: 10,
          paddingVertical: 6,
          borderRadius: theme.radius.sm,
          borderWidth: 1,
          borderColor: "#EF4444",
        }}
      >
        <ThemedText variant="caption" style={{ color: "#EF4444" }}>
          ✕
        </ThemedText>
      </PressableScale>
    </View>
  );
}

const stockBtnStyle = {
  width: 28,
  height: 28,
  borderRadius: 14,
  alignItems: "center" as const,
  justifyContent: "center" as const,
  borderWidth: 1,
};
