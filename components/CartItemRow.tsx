import { View } from "react-native";
import { Image } from "expo-image";
import { PressableScale } from "@/components/PressableScale";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/theme/ThemeContext";
import type { CartItem } from "@/types/cart";

type Props = {
  item: CartItem;
  onRemove: (listingId: string) => void;
};

export function CartItemRow({ item, onRemove }: Props) {
  const theme = useTheme();
  const subtotal = `$${((item.unitPriceCents * item.qty) / 100).toFixed(2)}`;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
      }}
    >
      <Image
        source={{ uri: item.imageUrl }}
        style={{ width: 64, height: 64, borderRadius: theme.radius.sm }}
        contentFit="cover"
        accessibilityLabel={item.title}
      />

      <View style={{ flex: 1, gap: 4 }}>
        <ThemedText variant="label">{item.title}</ThemedText>
        <ThemedText variant="caption" color="muted">
          {item.qty} × {item.priceLabel}
        </ThemedText>
      </View>

      <View style={{ alignItems: "flex-end", gap: 8 }}>
        <ThemedText variant="label">{subtotal}</ThemedText>
        <PressableScale
          accessibilityLabel={`Remove ${item.title}`}
          onPress={() => onRemove(item.listingId)}
          style={{
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: theme.radius.sm,
            borderWidth: 1,
            borderColor: "#EF4444",
          }}
        >
          <ThemedText variant="caption" style={{ color: "#EF4444" }}>
            Remove
          </ThemedText>
        </PressableScale>
      </View>
    </View>
  );
}
