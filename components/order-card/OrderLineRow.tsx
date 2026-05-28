import { memo } from "react";
import { View } from "react-native";
import { Image } from "expo-image";
import { PressableScale } from "@/components/PressableScale";
import { ThemedText } from "@/components/ThemedText";
import { OrderLineReturnFold } from "@/components/order-card/OrderLineReturnFold";
import {
  getShopperLineDisplayStatus,
  linePendingReturnQty,
  type OrderLineFields,
} from "@/lib/order-line";
import { ReturnDispositionSummary } from "@/components/return-resolution/ReturnDispositionSummary";
import type { ReturnResolution } from "@/lib/return-resolution";
import {
  orderStatusBadgeStyle,
  orderStatusLabel,
  shopperDisplayStatusBadgeStyle,
  shopperDisplayStatusLabel,
  type ShopperDisplayStatus,
} from "@/lib/order-status";
import { useTheme } from "@/theme/ThemeContext";

export type OrderLineDisplay = OrderLineFields & {
  id: string;
  title: string;
  image_url: string;
  unit_price_cents: number;
};

type Props = {
  line: OrderLineDisplay;
  warrantyNow?: number;
  onStatusPress?: () => void;
  statusBusy?: boolean;
  onRequestReturn?: () => void;
  returnBusy?: boolean;
  onReturnFoldExpandedChange?: (expanded: boolean) => void;
};

export const OrderLineRow = memo(function OrderLineRow({
  line,
  warrantyNow = Date.now(),
  onStatusPress,
  statusBusy,
  onRequestReturn,
  returnBusy,
  onReturnFoldExpandedChange,
}: Props) {
  const theme = useTheme();
  const shopperReturns = onRequestReturn !== undefined;
  const pendingQty = linePendingReturnQty(line);
  const resolvedReturns = (line.return_requests ?? []).filter((r) => r.status === "resolved");
  const lineDisplayStatus = getShopperLineDisplayStatus(line);

  return (
    <View style={{ width: "100%", gap: shopperReturns ? 4 : 0 }}>
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
        <Image
          source={{ uri: line.image_url }}
          style={{ width: 44, height: 44, borderRadius: theme.radius.sm }}
          contentFit="cover"
        />
        <View style={{ flex: 1, gap: 4, minWidth: 0 }}>
          <ThemedText variant="label" numberOfLines={1}>
            {line.title}
          </ThemedText>
          <ThemedText variant="caption" color="muted">
            {line.qty} × ${(line.unit_price_cents / 100).toFixed(2)}
            {line.return_qty > 0 ? ` · ${line.return_qty} returned` : ""}
          </ThemedText>

          {!shopperReturns ? (
            <>
              {pendingQty > 0 ? (
                <ReturnDispositionSummary
                  status="requested"
                  subtitle={`${pendingQty} unit${pendingQty === 1 ? "" : "s"} awaiting review`}
                />
              ) : null}
              {resolvedReturns.slice(-1).map((r) => (
                <ReturnDispositionSummary
                  key={r.id}
                  status="resolved"
                  resolution={r.resolution as ReturnResolution}
                  returnAccepted={r.return_accepted}
                  refundKind={r.refund_kind}
                  refundCents={r.refund_cents}
                />
              ))}
            </>
          ) : null}
        </View>
        {onStatusPress ? (
          <PressableScale
            accessibilityLabel={`Change status for ${line.title}`}
            onPress={() => {
              if (statusBusy) return;
              onStatusPress();
            }}
          >
            <LineStatusBadge
              status={line.status}
              displayStatus={lineDisplayStatus}
              busy={statusBusy}
            />
          </PressableScale>
        ) : (
          <LineStatusBadge status={line.status} displayStatus={lineDisplayStatus} />
        )}
      </View>

      {shopperReturns ? (
          <OrderLineReturnFold
            line={line}
            productTitle={line.title}
            warrantyNow={warrantyNow}
            onRequestReturn={onRequestReturn}
            returnBusy={returnBusy}
            onExpandedChange={onReturnFoldExpandedChange}
          />
      ) : null}
    </View>
  );
});

function LineStatusBadge({
  status,
  displayStatus,
  busy,
}: {
  status: OrderLineDisplay["status"];
  displayStatus: ShopperDisplayStatus;
  busy?: boolean;
}) {
  const theme = useTheme();
  const scheme = theme.scheme;
  const useShopperStyle = displayStatus !== status;
  const { borderColor, backgroundColor, textColor } = useShopperStyle
    ? shopperDisplayStatusBadgeStyle(displayStatus, scheme)
    : orderStatusBadgeStyle(status, scheme);

  return (
    <View
      style={{
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: theme.radius.pill,
        borderWidth: 1,
        borderColor,
        backgroundColor,
        maxWidth: useShopperStyle ? 124 : 108,
      }}
    >
      <ThemedText variant="caption" style={{ color: textColor }} numberOfLines={1}>
        {busy
          ? "…"
          : useShopperStyle
            ? shopperDisplayStatusLabel(displayStatus)
            : orderStatusLabel(status)}
      </ThemedText>
    </View>
  );
}
