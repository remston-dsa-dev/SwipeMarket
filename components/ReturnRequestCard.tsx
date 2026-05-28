import { View } from "react-native";
import { Image } from "expo-image";
import { PressableScale } from "@/components/PressableScale";
import { ThemedText } from "@/components/ThemedText";
import { OrderPartyBadge } from "@/components/order-card/OrderPartyBadge";
import type { ReturnRequestRow } from "@/hooks/useReturnRequests";
import { ReturnDispositionSummary } from "@/components/return-resolution/ReturnDispositionSummary";
import {
  resolveStatusTone,
  TONE_PLACED,
  TONE_PROCESSING,
  TONE_RETURN_REQUESTED,
} from "@/lib/status-colors";
import { returnRequestStatusLabel } from "@/lib/return-resolution";
import { useTheme } from "@/theme/ThemeContext";

type Props = {
  request: ReturnRequestRow;
  role: "customer" | "supplier";
  variant?: "full" | "timeline";
  hidePartyBadge?: boolean;
  onCancel?: () => void;
  onResolve?: () => void;
  busy?: boolean;
};

function statusTone(
  status: ReturnRequestRow["status"],
  scheme: "light" | "dark",
): string {
  switch (status) {
    case "requested":
      return resolveStatusTone(TONE_PROCESSING, scheme);
    case "resolved":
      return resolveStatusTone(TONE_PLACED, scheme);
    case "cancelled":
      return resolveStatusTone(TONE_RETURN_REQUESTED, scheme);
    default:
      return resolveStatusTone(TONE_RETURN_REQUESTED, scheme);
  }
}

export function ReturnRequestCard({
  request,
  role,
  variant = "full",
  hidePartyBadge,
  onCancel,
  onResolve,
  busy,
}: Props) {
  const theme = useTheme();
  const scheme = theme.scheme;
  const when = new Date(request.created_at).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  const lineValue = ((request.qty * request.order_item.unit_price_cents) / 100).toFixed(2);
  const statusColor = statusTone(request.status, scheme);
  const statusLabel = returnRequestStatusLabel(request.status);

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

  if (variant === "timeline") {
    return (
      <View style={{ paddingVertical: 10, gap: 6 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flex: 1 }}>
            <View
              style={{
                width: 7,
                height: 7,
                borderRadius: 4,
                backgroundColor: statusColor,
              }}
            />
            <ThemedText variant="caption" style={{ color: statusColor, fontWeight: "600" }}>
              {statusLabel}
            </ThemedText>
            <ThemedText variant="caption" color="muted">
              · {when}
            </ThemedText>
          </View>
          <ThemedText variant="caption" color="muted">
            {request.qty}× ${lineValue}
          </ThemedText>
        </View>

        {request.reason ? (
          <ThemedText variant="caption" color="secondary" style={{ paddingLeft: 13 }}>
            {request.reason}
          </ThemedText>
        ) : null}

        {request.status === "resolved" ? (
          <View style={{ paddingLeft: 13 }}>
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
          <PressableScale
            accessibilityLabel="Cancel return request"
            onPress={onCancel}
            disabled={busy}
            style={{ alignSelf: "flex-start", paddingLeft: 13, paddingVertical: 2 }}
          >
            <ThemedText variant="caption" color="primary" style={{ fontWeight: "600" }}>
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
              marginLeft: 13,
              marginTop: 2,
              paddingHorizontal: 12,
              paddingVertical: 7,
              borderRadius: theme.radius.sm,
              backgroundColor: theme.colors.primary,
            }}
          >
            <ThemedText variant="caption" color="onPrimary" style={{ fontWeight: "600" }}>
              {busy ? "Saving…" : "Resolve"}
            </ThemedText>
          </PressableScale>
        ) : null}
      </View>
    );
  }

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
      <View
        style={{
          flexDirection: "row",
          justifyContent: hidePartyBadge ? "flex-end" : "space-between",
          alignItems: "flex-start",
        }}
      >
        {hidePartyBadge ? <View style={{ flex: 1 }} /> : <OrderPartyBadge party={party} />}
        <ThemedText variant="caption" style={{ color: statusColor, fontWeight: "600" }}>
          {statusLabel}
        </ThemedText>
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
            {request.qty} unit{request.qty === 1 ? "" : "s"} · ${lineValue}
          </ThemedText>
        </View>
      </View>

      {request.reason ? (
        <ThemedText variant="caption" color="secondary">
          {request.reason}
        </ThemedText>
      ) : null}

      {request.status === "resolved" ? (
        <ReturnDispositionSummary
          status="resolved"
          resolution={request.resolution}
          returnAccepted={request.return_accepted}
          refundKind={request.refund_kind}
          refundCents={request.refund_cents}
          subtitle={request.supplier_note ? `Note: ${request.supplier_note}` : undefined}
        />
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
