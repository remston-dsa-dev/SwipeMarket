import { View } from "react-native";
import { Image } from "expo-image";
import { PressableScale } from "@/components/PressableScale";
import { ThemedText } from "@/components/ThemedText";
import {
  isLineReturnEligible,
  linePendingReturnQty,
  returnWarrantyDaysRemaining,
  type OrderLineFields,
} from "@/lib/order-line";
import { returnResolutionLabel, type ReturnResolution } from "@/lib/return-resolution";
import { orderStatusBadgeStyle, orderStatusColor, orderStatusLabel } from "@/lib/order-status";
import { useTheme } from "@/theme/ThemeContext";

export type OrderLineDisplay = OrderLineFields & {
  id: string;
  title: string;
  image_url: string;
  unit_price_cents: number;
};

type Props = {
  line: OrderLineDisplay;
  onStatusPress?: () => void;
  statusBusy?: boolean;
  onRequestReturn?: () => void;
  returnBusy?: boolean;
};

export function OrderLineRow({
  line,
  onStatusPress,
  statusBusy,
  onRequestReturn,
  returnBusy,
}: Props) {
  const theme = useTheme();
  const eligible = isLineReturnEligible(line);
  const daysLeft = returnWarrantyDaysRemaining(line.shipped_at);
  const pendingQty = linePendingReturnQty(line);
  const resolvedReturns = (line.return_requests ?? []).filter((r) => r.status === "resolved");

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
      <Image
        source={{ uri: line.image_url }}
        style={{ width: 44, height: 44, borderRadius: theme.radius.sm }}
        contentFit="cover"
      />
      <View style={{ flex: 1, gap: 4 }}>
        <ThemedText variant="label" numberOfLines={1}>
          {line.title}
        </ThemedText>
        <ThemedText variant="caption" color="muted">
          {line.qty} × ${(line.unit_price_cents / 100).toFixed(2)}
          {line.return_qty > 0 ? ` · ${line.return_qty} returned` : ""}
        </ThemedText>
        {eligible && daysLeft !== null && (
          <ThemedText variant="caption" style={{ color: orderStatusColor("delivered") }}>
            Return eligible · {daysLeft} day{daysLeft === 1 ? "" : "s"} left
          </ThemedText>
        )}
        {line.status === "delivered" && !eligible && line.return_qty < line.qty && daysLeft === 0 && (
          <ThemedText variant="caption" color="muted">
            Return window ended
          </ThemedText>
        )}
        {pendingQty > 0 ? (
          <ThemedText variant="caption" style={{ color: "#D97706" }}>
            Return pending review · {pendingQty} unit{pendingQty === 1 ? "" : "s"}
          </ThemedText>
        ) : null}
        {resolvedReturns.slice(-1).map((r) => (
          <ThemedText key={r.id} variant="caption" color="muted" numberOfLines={1}>
            {returnResolutionLabel(r.resolution as ReturnResolution)}
            {r.refund_kind !== "none" ? ` · $${(r.refund_cents / 100).toFixed(2)} refund` : ""}
          </ThemedText>
        ))}
        {eligible && onRequestReturn ? (
          <PressableScale
            accessibilityLabel={`Request return for ${line.title}`}
            onPress={onRequestReturn}
            disabled={returnBusy}
            style={{
              alignSelf: "flex-start",
              marginTop: 4,
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: theme.radius.pill,
              borderWidth: 1,
              borderColor: theme.colors.primary,
            }}
          >
            <ThemedText variant="caption" color="primary" style={{ fontWeight: "600" }}>
              {returnBusy ? "Submitting…" : "Request return / refund"}
            </ThemedText>
          </PressableScale>
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
          <LineStatusBadge status={line.status} busy={statusBusy} />
        </PressableScale>
      ) : (
        <LineStatusBadge status={line.status} />
      )}
    </View>
  );
}

function LineStatusBadge({
  status,
  busy,
}: {
  status: OrderLineDisplay["status"];
  busy?: boolean;
}) {
  const theme = useTheme();
  const { borderColor, backgroundColor, textColor } = orderStatusBadgeStyle(status);

  return (
    <View
      style={{
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: theme.radius.pill,
        borderWidth: 1,
        borderColor,
        backgroundColor,
        maxWidth: 108,
      }}
    >
      <ThemedText variant="caption" style={{ color: textColor }} numberOfLines={1}>
        {busy ? "…" : orderStatusLabel(status)}
      </ThemedText>
    </View>
  );
}
