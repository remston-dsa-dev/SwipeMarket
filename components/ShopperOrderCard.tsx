import { memo, useMemo, useState } from "react";
import { View } from "react-native";
import { PressableScale } from "@/components/PressableScale";
import { ThemedText } from "@/components/ThemedText";
import {
  COLLAPSED_CARD_MIN_HEIGHT,
  COLLAPSED_LINES_MAX_HEIGHT,
  PREVIEW_LINE_COUNT,
} from "@/components/order-card/constants";
import { OrderLineRow } from "@/components/order-card/OrderLineRow";
import { OrderPartyBadge } from "@/components/order-card/OrderPartyBadge";
import { OrderStatusBadge } from "@/components/order-card/OrderStatusBadge";
import { OrderStatusTimeline } from "@/components/order-card/OrderStatusTimeline";
import type { CustomerOrder } from "@/hooks/useCustomerOrders";
import { formatOrderLabel } from "@/lib/order-label";
import { getShopperOrderDisplayStatus, orderLineTotals, orderSummaryLabel } from "@/lib/order-line";
import { useTheme } from "@/theme/ThemeContext";

type Props = {
  order: CustomerOrder;
  warrantyNow: number;
  /** Section header already shows partner profile. */
  hidePartyBadge?: boolean;
  onRequestReturn?: (line: CustomerOrder["order_items"][number]) => void;
  returnBusyLineId?: string | null;
};

export const ShopperOrderCard = memo(function ShopperOrderCard({
  order,
  warrantyNow,
  hidePartyBadge = false,
  onRequestReturn,
  returnBusyLineId,
}: Props) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [returnFoldOpenLineIds, setReturnFoldOpenLineIds] = useState<Set<string>>(
    () => new Set(),
  );

  const linesUnclipped = expanded || returnFoldOpenLineIds.size > 0;

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

  const orderDisplayStatus = useMemo(
    () => getShopperOrderDisplayStatus(order),
    [order],
  );

  const visibleLines = expanded
    ? order.order_items
    : order.order_items.slice(0, PREVIEW_LINE_COUNT);
  const hiddenCount = Math.max(0, productCount - PREVIEW_LINE_COUNT);

  return (
    <View
      style={{
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        padding: 16,
        gap: 12,
        backgroundColor: theme.colors.surface,
        minHeight: linesUnclipped ? undefined : COLLAPSED_CARD_MIN_HEIGHT,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        <View style={{ flex: 1, gap: 6 }}>
          <ThemedText variant="label" style={{ fontWeight: "700" }}>
            {formatOrderLabel(order.id)}
          </ThemedText>
          {hidePartyBadge ? null : (
            <OrderPartyBadge
              party={{
                name: order.supplier?.full_name ?? "",
                avatarUrl: order.supplier?.avatar_url ?? null,
                fallbackLabel: "Partner",
              }}
            />
          )}
          <ThemedText variant="caption" color="muted">
            {when}
          </ThemedText>
          <ThemedText variant="headline">${(order.total_cents / 100).toFixed(2)}</ThemedText>
          <ThemedText variant="caption" color="secondary">
            {orderSummaryLabel(productCount, totalCount, totalReturns)}
          </ThemedText>
        </View>
        <OrderStatusBadge status={order.status} displayStatus={orderDisplayStatus} />
      </View>

      <OrderStatusTimeline status={order.status} />

      <View
        style={{
          gap: 10,
          maxHeight: linesUnclipped ? undefined : COLLAPSED_LINES_MAX_HEIGHT,
          overflow: linesUnclipped ? "visible" : "hidden",
        }}
      >
        {visibleLines.map((line) => (
          <OrderLineRow
            key={line.id}
            line={line}
            warrantyNow={warrantyNow}
            onRequestReturn={
              onRequestReturn ? () => onRequestReturn(line) : undefined
            }
            returnBusy={returnBusyLineId === line.id}
            onReturnFoldExpandedChange={(open) => {
              setReturnFoldOpenLineIds((prev) => {
                const next = new Set(prev);
                if (open) next.add(line.id);
                else next.delete(line.id);
                return next;
              });
              if (open) setExpanded(true);
            }}
          />
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
});
