import { View } from "react-native";
import { Image } from "expo-image";
import { PressableScale } from "@/components/PressableScale";
import { ThemedText } from "@/components/ThemedText";
import { OrderPartyBadge } from "@/components/order-card/OrderPartyBadge";
import type { ReturnRequestRow } from "@/hooks/useReturnRequests";
import { ReturnDispositionSummary } from "@/components/return-resolution/ReturnDispositionSummary";
import { DispositionChip } from "@/components/return-resolution/DispositionChip";
import { pendingChipStyle } from "@/components/return-resolution/disposition-chip-styles";
import { returnRequestStatusLabel } from "@/lib/return-resolution";
import { useTheme } from "@/theme/ThemeContext";

type Props = {
  request: ReturnRequestRow;
  role: "customer" | "supplier";
  /** Hide when the parent already shows the party in a section header. */
  hidePartyBadge?: boolean;
  onCancel?: () => void;
  onResolve?: () => void;
  busy?: boolean;
};

export function ReturnRequestCard({
  request,
  role,
  hidePartyBadge,
  onCancel,
  onResolve,
  busy,
}: Props) {
  const theme = useTheme();
  const when = new Date(request.created_at).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  const isDark = theme.scheme === "dark";

  const party =
    role === "customer"
      ? {
          name: request.supplier?.full_name ?? "",
          avatarUrl: request.supplier?.avatar_url ?? null,
          fallbackLabel: "Partner",
        }
      : {
          name: request.customer?.full_name ?? "",
          avatarUrl: request.customer?.avatar_url ?? null,
          fallbackLabel: "Shopper",
        };

  return (
    <View
      style={{
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        padding: 16,
        gap: 10,
        backgroundColor: theme.colors.surface,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        {hidePartyBadge ? (
          <View style={{ flex: 1 }} />
        ) : (
          <OrderPartyBadge party={party} />
        )}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderRadius: theme.radius.pill,
            backgroundColor: theme.colors.overlay,
            borderWidth: 1,
            borderColor: theme.colors.border,
          }}
        >
          {request.status === "requested" ? (
            <DispositionChip style={pendingChipStyle(isDark)} />
          ) : null}
          <ThemedText variant="caption" style={{ fontWeight: "600" }}>
            {returnRequestStatusLabel(request.status)}
          </ThemedText>
        </View>
      </View>

      <ThemedText variant="caption" color="muted">
        {when}
      </ThemedText>

      <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
        <Image
          source={{ uri: request.order_item.image_url }}
          style={{ width: 48, height: 48, borderRadius: theme.radius.sm }}
          contentFit="cover"
        />
        <View style={{ flex: 1, gap: 4 }}>
          <ThemedText variant="label" numberOfLines={2}>
            {request.order_item.title}
          </ThemedText>
          <ThemedText variant="caption" color="muted">
            {request.qty} unit{request.qty === 1 ? "" : "s"} · $
            {((request.qty * request.order_item.unit_price_cents) / 100).toFixed(2)} line value
          </ThemedText>
        </View>
      </View>

      {request.reason ? (
        <ThemedText variant="caption" color="secondary">
          Reason: {request.reason}
        </ThemedText>
      ) : null}

      {request.status === "resolved" ? (
        <View
          style={{
            padding: 10,
            borderRadius: theme.radius.sm,
            backgroundColor: theme.colors.overlay,
            borderWidth: 1,
            borderColor: theme.colors.border,
          }}
        >
          <ReturnDispositionSummary
            status="resolved"
            resolution={request.resolution}
            returnAccepted={request.return_accepted}
            refundKind={request.refund_kind}
            refundCents={request.refund_cents}
            subtitle={request.supplier_note ? `Note: ${request.supplier_note}` : undefined}
          />
        </View>
      ) : null}

      {request.status === "requested" && role === "customer" && onCancel ? (
        <PressableScale accessibilityLabel="Cancel return request" onPress={onCancel} disabled={busy}>
          <ThemedText variant="label" color="primary">
            {busy ? "Cancelling…" : "Cancel request"}
          </ThemedText>
        </PressableScale>
      ) : null}

      {request.status === "requested" && role === "supplier" && onResolve ? (
        <PressableScale
          accessibilityLabel="Resolve return request"
          onPress={onResolve}
          disabled={busy}
          style={{
            alignSelf: "flex-start",
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderRadius: theme.radius.md,
            backgroundColor: theme.colors.primary,
          }}
        >
          <ThemedText variant="label" color="onPrimary">
            {busy ? "Saving…" : "Resolve"}
          </ThemedText>
        </PressableScale>
      ) : null}
    </View>
  );
}
