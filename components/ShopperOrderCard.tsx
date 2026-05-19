import { useMemo, useState } from "react";
import { View } from "react-native";
import { PressableScale } from "@/components/PressableScale";
import { ThemedText } from "@/components/ThemedText";
import {
  COLLAPSED_CARD_MIN_HEIGHT,
  COLLAPSED_LINES_MAX_HEIGHT,
  PREVIEW_LINE_COUNT,
} from "@/components/order-card/constants";
import { OrderLineRow } from "@/components/order-card/OrderLineRow";
import { OrderStatusBadge } from "@/components/order-card/OrderStatusBadge";
import { OrderStatusTimeline } from "@/components/order-card/OrderStatusTimeline";
import type { CustomerOrder } from "@/hooks/useCustomerOrders";
import {
  isLineReturnEligible,
  orderLineTotals,
  orderSummaryLabel,
  RETURN_WARRANTY_DAYS,
} from "@/lib/order-line";
import { useTheme } from "@/theme/ThemeContext";

type Props = {
  order: CustomerOrder;
};

export function ShopperOrderCard({ order }: Props) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);

  const when = new Date(order.created_at).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  const { totalCount, totalReturns, productCount } = useMemo(
    () => orderLineTotals(order.order_items),
    [order.order_items],
  );

  const visibleLines = expanded
    ? order.order_items
    : order.order_items.slice(0, PREVIEW_LINE_COUNT);
  const hiddenCount = Math.max(0, productCount - PREVIEW_LINE_COUNT);
  const hasEligibleReturns = order.order_items.some(isLineReturnEligible);

  return (
    <View
      style={{
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        padding: 16,
        gap: 12,
        backgroundColor: theme.colors.surface,
        minHeight: expanded ? undefined : COLLAPSED_CARD_MIN_HEIGHT,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        <View style={{ flex: 1, gap: 6 }}>
          <ThemedText variant="caption" color="muted">
            {when}
          </ThemedText>
          <ThemedText variant="headline">${(order.total_cents / 100).toFixed(2)}</ThemedText>
          <ThemedText variant="caption" color="secondary">
            {orderSummaryLabel(productCount, totalCount, totalReturns)}
          </ThemedText>
        </View>
        <OrderStatusBadge status={order.status} />
      </View>

      <OrderStatusTimeline status={order.status} />

      {hasEligibleReturns && (
        <View
          style={{
            paddingHorizontal: 10,
            paddingVertical: 8,
            borderRadius: theme.radius.sm,
            backgroundColor: theme.colors.overlay,
            borderWidth: 1,
            borderColor: theme.colors.border,
          }}
        >
          <ThemedText variant="caption" color="secondary">
            Shipped lines are eligible to return within {RETURN_WARRANTY_DAYS} days of delivery.
          </ThemedText>
        </View>
      )}

      <View
        style={{
          gap: 10,
          maxHeight: expanded ? undefined : COLLAPSED_LINES_MAX_HEIGHT,
          overflow: expanded ? "visible" : "hidden",
        }}
      >
        {visibleLines.map((line) => (
          <OrderLineRow key={line.id} line={line} />
        ))}
      </View>

      {hiddenCount > 0 && (
        <PressableScale
          accessibilityLabel={expanded ? "Show fewer items" : `Show ${hiddenCount} more items`}
          onPress={() => setExpanded((v) => !v)}
          style={{
            alignSelf: "flex-start",
            paddingVertical: 6,
            paddingHorizontal: 2,
          }}
        >
          <ThemedText variant="label" color="primary">
            {expanded ? "Show less" : `Show ${hiddenCount} more`}
          </ThemedText>
        </PressableScale>
      )}
    </View>
  );
}
