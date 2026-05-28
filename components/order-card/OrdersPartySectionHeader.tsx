import { View } from "react-native";
import { OrderPartyBadge } from "@/components/order-card/OrderPartyBadge";
import type { OrderPartyInfo } from "@/components/order-card/OrderPartyBadge";
import { ThemedText } from "@/components/ThemedText";

type Props = {
  party: OrderPartyInfo;
  orderCount: number;
  subtitle?: string;
};

export function OrdersPartySectionHeader({ party, orderCount, subtitle }: Props) {
  return (
    <View style={{ gap: 6, marginBottom: 12 }}>
      <OrderPartyBadge party={party} />
      <ThemedText variant="caption" color="muted">
        {orderCount} order{orderCount === 1 ? "" : "s"}
        {subtitle ? ` · ${subtitle}` : ""}
      </ThemedText>
    </View>
  );
}
