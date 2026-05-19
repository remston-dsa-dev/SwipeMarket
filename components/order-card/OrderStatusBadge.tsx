import { View } from "react-native";
import { PressableScale } from "@/components/PressableScale";
import { ThemedText } from "@/components/ThemedText";
import { orderStatusColor, orderStatusLabel, type OrderStatus } from "@/lib/order-status";
import { useTheme } from "@/theme/ThemeContext";

type Props = {
  status: OrderStatus;
  onPress?: () => void;
  busy?: boolean;
};

export function OrderStatusBadge({ status, onPress, busy }: Props) {
  const theme = useTheme();
  const color = orderStatusColor(status);
  const label = busy ? "…" : orderStatusLabel(status);

  const badge = (
    <View
      style={{
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: theme.radius.pill,
        borderWidth: 1,
        borderColor: onPress ? theme.colors.primary : color,
        backgroundColor: onPress ? theme.colors.overlay : `${color}18`,
      }}
    >
      <ThemedText variant="caption" style={{ color: onPress ? theme.colors.primary : color }}>
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
