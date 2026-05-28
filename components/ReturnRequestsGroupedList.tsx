import { View } from "react-native";
import { Image } from "expo-image";
import { ReturnRequestCard } from "@/components/ReturnRequestCard";
import { OrderPartyBadge } from "@/components/order-card/OrderPartyBadge";
import { ThemedText } from "@/components/ThemedText";
import type { ReturnRequestRow } from "@/hooks/useReturnRequests";
import { formatOrderLabel } from "@/lib/order-label";
import type { ReturnLineGroup, ReturnOrderGroup } from "@/lib/return-list-grouping";
import { useTheme } from "@/theme/ThemeContext";

type Party = {
  name: string;
  avatarUrl: string | null;
  fallbackLabel: string;
};

type Props = {
  orderGroups: ReturnOrderGroup[];
  role: "customer" | "supplier";
  orderParty?: (order: ReturnOrderGroup) => Party | null;
  cancellingId?: string | null;
  resolveBusyId?: string | null;
  onCancel?: (requestId: string) => void;
  onResolve?: (request: ReturnRequestRow) => void;
};

function Hairline() {
  const theme = useTheme();
  return (
    <View
      style={{
        height: 1,
        backgroundColor: theme.colors.border,
        marginVertical: 2,
      }}
    />
  );
}

function ReturnLineBlock({
  line,
  role,
  isLastLine,
  cancellingId,
  resolveBusyId,
  onCancel,
  onResolve,
}: {
  line: ReturnLineGroup;
  role: "customer" | "supplier";
  isLastLine: boolean;
  cancellingId?: string | null;
  resolveBusyId?: string | null;
  onCancel?: (requestId: string) => void;
  onResolve?: (request: ReturnRequestRow) => void;
}) {
  const theme = useTheme();

  return (
    <View style={{ gap: 0 }}>
      <View
        style={{
          flexDirection: "row",
          gap: 10,
          alignItems: "center",
          paddingVertical: 10,
        }}
      >
        <Image
          source={{ uri: line.imageUrl }}
          style={{ width: 36, height: 36, borderRadius: theme.radius.sm }}
          contentFit="cover"
        />
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <ThemedText variant="label" numberOfLines={2}>
            {line.title}
          </ThemedText>
          <ThemedText variant="caption" color="muted">
            {line.requests.length} {line.requests.length === 1 ? "request" : "requests"}
            {line.pendingCount > 0 ? ` · ${line.pendingCount} pending` : ""}
          </ThemedText>
        </View>
      </View>

      <View style={{ paddingLeft: 46, gap: 0 }}>
        {line.requests.map((request, index) => (
          <View key={request.id}>
            {index > 0 ? <Hairline /> : null}
            <ReturnRequestCard
              request={request}
              role={role}
              variant="timeline"
              busy={cancellingId === request.id || resolveBusyId === request.id}
              onCancel={
                request.status === "requested" && onCancel
                  ? () => onCancel(request.id)
                  : undefined
              }
              onResolve={
                request.status === "requested" && onResolve
                  ? () => onResolve(request)
                  : undefined
              }
            />
          </View>
        ))}
      </View>

      {!isLastLine ? <Hairline /> : null}
    </View>
  );
}

function ReturnOrderSection({
  order,
  role,
  orderParty,
  cancellingId,
  resolveBusyId,
  onCancel,
  onResolve,
}: {
  order: ReturnOrderGroup;
  role: "customer" | "supplier";
  orderParty?: Party | null;
  cancellingId?: string | null;
  resolveBusyId?: string | null;
  onCancel?: (requestId: string) => void;
  onResolve?: (request: ReturnRequestRow) => void;
}) {
  const theme = useTheme();

  return (
    <View
      style={{
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        padding: 14,
        gap: 4,
        backgroundColor: theme.colors.surface,
      }}
    >
      <View style={{ gap: 6, marginBottom: 4 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          <ThemedText variant="label" style={{ fontWeight: "700" }}>
            {formatOrderLabel(order.orderId)}
          </ThemedText>
          {order.pendingCount > 0 ? (
            <ThemedText variant="caption" color="secondary" style={{ fontWeight: "600" }}>
              {order.pendingCount} pending
            </ThemedText>
          ) : null}
        </View>
        {orderParty ? <OrderPartyBadge party={orderParty} /> : null}
      </View>

      {order.lineGroups.map((line, index) => (
        <ReturnLineBlock
          key={line.orderItemId}
          line={line}
          role={role}
          isLastLine={index === order.lineGroups.length - 1}
          cancellingId={cancellingId}
          resolveBusyId={resolveBusyId}
          onCancel={onCancel}
          onResolve={onResolve}
        />
      ))}
    </View>
  );
}

export function ReturnRequestsGroupedList({
  orderGroups,
  role,
  orderParty,
  cancellingId,
  resolveBusyId,
  onCancel,
  onResolve,
}: Props) {
  return (
    <View style={{ gap: 12 }}>
      {orderGroups.map((order) => (
        <ReturnOrderSection
          key={order.orderId}
          order={order}
          role={role}
          orderParty={orderParty?.(order) ?? null}
          cancellingId={cancellingId}
          resolveBusyId={resolveBusyId}
          onCancel={onCancel}
          onResolve={onResolve}
        />
      ))}
    </View>
  );
}
