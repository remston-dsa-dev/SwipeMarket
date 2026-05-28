import { useMemo, useState } from "react";
import { ActivityIndicator, Alert, FlatList, View } from "react-native";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { OrderStatusPickerSheet } from "@/components/OrderStatusPickerSheet";
import { ReturnResolutionSheet } from "@/components/ReturnResolutionSheet";
import { SupplierHeaderActions } from "@/components/SupplierHeaderActions";
import { OrderStatusLegend } from "@/components/order-card/OrderStatusLegend";
import { OrdersEmptyState } from "@/components/order-card/OrdersEmptyState";
import { OrdersPartySectionHeader } from "@/components/order-card/OrdersPartySectionHeader";
import { SupplierOrderCard } from "@/components/SupplierOrderCard";
import { PressableScale } from "@/components/PressableScale";
import { Screen } from "@/components/Screen";
import { ThemedText } from "@/components/ThemedText";
import { useSupplierOrders, type SupplierOrder, type SupplierOrderItem } from "@/hooks/useSupplierOrders";
import { isSupabaseConfigured } from "@/lib/is-supabase-configured";
import type { OrderStatus } from "@/lib/order-status";
import type { ReturnResolution } from "@/lib/return-resolution";
import { supplierSetOrderItemStatus, supplierSetOrderStatus } from "@/lib/orders-remote";
import { resolveReturnRequest } from "@/lib/returns-remote";
import { groupSupplierOrdersByShopper } from "@/lib/orders-by-party";
import { useSessionStore } from "@/stores/session-store";
import { useTheme } from "@/theme/ThemeContext";

type StatusTarget =
  | { kind: "order"; order: SupplierOrder }
  | {
      kind: "line";
      order: SupplierOrder;
      lineId: string;
      lineTitle: string;
      status: OrderStatus;
    };

type ReturnResolveTarget = {
  requestId: string;
  line: SupplierOrderItem;
  reason: string | null;
};

export default function SupplierOrdersScreen() {
  const router = useRouter();
  const theme = useTheme();
  const queryClient = useQueryClient();
  const supplierId = useSessionStore((s) => s.userId);
  const { data: orders = [], isPending, error } = useSupplierOrders(supplierId);
  const [statusTarget, setStatusTarget] = useState<StatusTarget | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [returnTarget, setReturnTarget] = useState<ReturnResolveTarget | null>(null);
  const [resolveReturnBusyId, setResolveReturnBusyId] = useState<string | null>(null);

  const sections = useMemo(() => groupSupplierOrdersByShopper(orders), [orders]);

  function openReturnResolve(requestId: string, line: SupplierOrderItem) {
    const pending = line.return_requests.find((r) => r.id === requestId);
    setReturnTarget({
      requestId,
      line,
      reason: pending?.reason ?? null,
    });
  }

  async function applyReturnResolution(
    resolution: Exclude<ReturnResolution, "pending">,
    refundCents: number,
    note: string,
  ) {
    if (!returnTarget || !supplierId) return;
    setResolveReturnBusyId(returnTarget.requestId);
    try {
      await resolveReturnRequest(returnTarget.requestId, resolution, refundCents, note);
      void queryClient.invalidateQueries({ queryKey: ["supplier-orders", supplierId] });
      void queryClient.invalidateQueries({ queryKey: ["supplier-returns", supplierId] });
      void queryClient.invalidateQueries({ queryKey: ["customer-returns"] });
      setReturnTarget(null);
      Alert.alert("Return resolved", "The shopper will see your decision on this request.");
    } catch (e) {
      Alert.alert("Could not resolve", (e as Error).message);
    } finally {
      setResolveReturnBusyId(null);
    }
  }

  async function applyStatus(status: OrderStatus) {
    if (!statusTarget) return;

    const key =
      statusTarget.kind === "order"
        ? `order:${statusTarget.order.id}`
        : `item:${statusTarget.lineId}`;

    setSavingKey(key);
    try {
      if (statusTarget.kind === "order") {
        await supplierSetOrderStatus(statusTarget.order.id, status);
      } else {
        await supplierSetOrderItemStatus(statusTarget.lineId, status);
      }
      void queryClient.invalidateQueries({ queryKey: ["supplier-orders", supplierId] });
      void queryClient.invalidateQueries({ queryKey: ["customer-orders"] });
      setStatusTarget(null);
    } catch (e) {
      Alert.alert("Could not update status", (e as Error).message);
    } finally {
      setSavingKey(null);
    }
  }

  const pickerTitle =
    statusTarget?.kind === "line" ? "Product status" : "All products in order";
  const pickerSubtitle =
    statusTarget?.kind === "line" ? statusTarget.lineTitle : undefined;
  const pickerStatus =
    statusTarget?.kind === "line" ? statusTarget.status : statusTarget?.order.status ?? "placed";

  if (!isSupabaseConfigured()) {
    return (
      <Screen>
        <ThemedText variant="body" color="muted">
          Connect Supabase to load orders from shoppers.
        </ThemedText>
      </Screen>
    );
  }

  return (
    <Screen>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}>
          <PressableScale
            accessibilityLabel="Back to inventory"
            onPress={() => router.back()}
            style={{
              paddingVertical: 8,
              paddingHorizontal: 4,
            }}
          >
            <ThemedText variant="label">← Back</ThemedText>
          </PressableScale>
          <ThemedText variant="headline" numberOfLines={1} style={{ flex: 1 }}>
            Orders
          </ThemedText>
        </View>
        <SupplierHeaderActions />
      </View>

      {isPending ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : error ? (
        <ThemedText variant="body" style={{ color: "#EF4444" }}>
          {(error as Error).message}
        </ThemedText>
      ) : orders.length === 0 ? (
        <OrdersEmptyState
          variant="supplier"
          onPrimaryPress={() => router.replace("/(supplier)/dashboard")}
        />
      ) : (
        <>
          <OrderStatusLegend />
          <FlatList
            data={sections}
            keyExtractor={(s) => s.partyId}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ gap: 24, paddingBottom: 32 }}
            renderItem={({ item: section }) => (
              <View
                style={{
                  paddingBottom: 20,
                  marginBottom: 4,
                  borderBottomWidth: 1,
                  borderBottomColor: theme.colors.border,
                }}
              >
                <OrdersPartySectionHeader party={section.party} orderCount={section.orders.length} />
                <View style={{ gap: 12 }}>
                  {section.orders.map((order) => (
                  <SupplierOrderCard
                    key={order.id}
                    order={order}
                    hidePartyBadge
                    orderStatusBusy={savingKey === `order:${order.id}`}
                    lineStatusBusyId={
                      savingKey?.startsWith("item:") ? savingKey.slice(5) : null
                    }
                    resolveReturnBusyId={resolveReturnBusyId}
                    onResolveReturn={openReturnResolve}
                    onChangeOrderStatus={() => setStatusTarget({ kind: "order", order })}
                    onChangeLineStatus={(line) =>
                      setStatusTarget({
                        kind: "line",
                        order,
                        lineId: line.id,
                        lineTitle: line.title,
                        status: line.status,
                      })
                    }
                  />
                  ))}
                </View>
              </View>
            )}
          />
        </>
      )}

      <ReturnResolutionSheet
        visible={returnTarget != null}
        productTitle={returnTarget?.line.title ?? ""}
        qty={
          returnTarget?.line.return_requests.find((r) => r.id === returnTarget.requestId)?.qty ?? 1
        }
        unitPriceCents={returnTarget?.line.unit_price_cents ?? 0}
        reason={returnTarget?.reason ?? null}
        saving={resolveReturnBusyId != null}
        onResolve={(resolution, refundCents, note) =>
          void applyReturnResolution(resolution, refundCents, note)
        }
        onClose={() => {
          if (resolveReturnBusyId) return;
          setReturnTarget(null);
        }}
      />

      <OrderStatusPickerSheet
        visible={statusTarget !== null}
        title={pickerTitle}
        subtitle={pickerSubtitle}
        currentStatus={pickerStatus}
        saving={savingKey !== null}
        onSelect={(status) => void applyStatus(status)}
        onClose={() => {
          if (savingKey !== null) return;
          setStatusTarget(null);
        }}
      />
    </Screen>
  );
}
