import { View } from "react-native";
import { PressableScale } from "@/components/PressableScale";
import { ThemedText } from "@/components/ThemedText";
import {
  orderStatusBadgeStyle,
  orderStatusLabel,
  shopperDisplayStatusBadgeStyle,
  shopperDisplayStatusLabel,
  type OrderStatus,
  type ShopperDisplayStatus,
} from "@/lib/order-status";
import { useTheme } from "@/theme/ThemeContext";

type Props = {
  status: OrderStatus;
  /** When set (shopper orders), overrides the delivered label during returns. */
  displayStatus?: ShopperDisplayStatus;
  onPress?: () => void;
  busy?: boolean;
};

export function OrderStatusBadge({ status, displayStatus, onPress, busy }: Props) {
  const theme = useTheme();
  const effective = displayStatus ?? status;
  const useShopperStyle = displayStatus != null && displayStatus !== status;
  const { borderColor, backgroundColor, textColor } = useShopperStyle
    ? shopperDisplayStatusBadgeStyle(effective, theme.scheme)
    : orderStatusBadgeStyle(status, theme.scheme);
  const label = busy
    ? "…"
    : useShopperStyle
      ? shopperDisplayStatusLabel(effective)
      : orderStatusLabel(status);

  const badge = (
    <View
      style={{
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: theme.radius.pill,
        borderWidth: 1,
        borderColor,
        backgroundColor,
      }}
    >
      <ThemedText variant="caption" style={{ color: textColor }}>
        {label}
      </ThemedText>
    </View>
  );

  if (!onPress) return badge;

  return (
    <PressableScale
      accessibilityLabel="Change order status"
      onPress={() => {
        if (busy) return;
        onPress();
      }}
    >
      {badge}
    </PressableScale>
  );
}
