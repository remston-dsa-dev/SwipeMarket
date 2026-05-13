import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import { SupplierHeaderActions } from "@/components/SupplierHeaderActions";
import { PressableScale } from "@/components/PressableScale";
import { Screen } from "@/components/Screen";
import { ThemedText } from "@/components/ThemedText";
import { useSupplierOrders, type SupplierOrder } from "@/hooks/useSupplierOrders";
import { isSupabaseConfigured } from "@/lib/is-supabase-configured";
import { ORDER_STATUSES, orderStatusLabel, type OrderStatus } from "@/lib/order-status";
import { supplierSetOrderStatus } from "@/lib/orders-remote";
import { useSessionStore } from "@/stores/session-store";
import { useTheme } from "@/theme/ThemeContext";

function shopperLabel(order: SupplierOrder): string {
  const n = order.customer?.full_name?.trim();
  if (n) return n;
  return `Shopper · ${order.customer_id.slice(0, 8)}…`;
}

export default function SupplierOrdersScreen() {
  const router = useRouter();
  const theme = useTheme();
  const queryClient = useQueryClient();
  const supplierId = useSessionStore((s) => s.userId);
  const { data: orders = [], isPending, error } = useSupplierOrders(supplierId);
  const [statusModal, setStatusModal] = useState<SupplierOrder | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const sections = useMemo(() => {
    const byCustomer = new Map<string, SupplierOrder[]>();
    for (const o of orders) {
      const list = byCustomer.get(o.customer_id) ?? [];
      list.push(o);
      byCustomer.set(o.customer_id, list);
    }
    return Array.from(byCustomer.entries())
      .map(([customerId, list]) => ({
        customerId,
        title: shopperLabel(list[0]!),
        data: [...list].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        ),
      }))
      .sort(
        (a, b) =>
          new Date(b.data[0]!.created_at).getTime() - new Date(a.data[0]!.created_at).getTime(),
      );
  }, [orders]);

  async function applyStatus(orderId: string, status: OrderStatus) {
    setSavingId(orderId);
    try {
      await supplierSetOrderStatus(orderId, status);
      void queryClient.invalidateQueries({ queryKey: ["supplier-orders", supplierId] });
      setStatusModal(null);
    } catch (e) {
      Alert.alert("Could not update status", (e as Error).message);
    } finally {
      setSavingId(null);
    }
  }

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
        <View style={{ flex: 1, justifyContent: "center", gap: 10 }}>
          <ThemedText variant="headline">No orders yet</ThemedText>
          <ThemedText variant="body" color="muted">
            When shoppers check out items from your catalog, each order appears here with status
            you can update through fulfillment.
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={sections}
          keyExtractor={(s) => s.customerId}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ gap: 24, paddingBottom: 32 }}
          renderItem={({ item: section }) => (
            <View style={{ gap: 12 }}>
              <ThemedText variant="label" color="secondary">
                {section.title}
              </ThemedText>
              {section.data.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  busy={savingId === order.id}
                  onChangeStatus={() => setStatusModal(order)}
                />
              ))}
            </View>
          )}
        />
      )}

      <Modal
        visible={statusModal !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setStatusModal(null)}
      >
        <View style={{ flex: 1, justifyContent: "flex-end" }}>
          <Pressable
            accessibilityLabel="Dismiss"
            style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(0,0,0,0.45)" }]}
            onPress={() => setStatusModal(null)}
          />
          <View
            style={{
              backgroundColor: theme.colors.surface,
              borderTopLeftRadius: theme.radius.lg,
              borderTopRightRadius: theme.radius.lg,
              paddingHorizontal: 20,
              paddingTop: 16,
              paddingBottom: 36,
              gap: 8,
            }}
          >
            <ThemedText variant="headline" style={{ marginBottom: 8 }}>
              Order status
            </ThemedText>
            {statusModal
              ? ORDER_STATUSES.map((s) => (
                  <PressableScale
                    key={s}
                    accessibilityLabel={orderStatusLabel(s)}
                    onPress={() => {
                      if (savingId !== null) return;
                      void applyStatus(statusModal.id, s);
                    }}
                    style={{
                      paddingVertical: 14,
                      paddingHorizontal: 16,
                      borderRadius: theme.radius.md,
                      borderWidth: 1,
                      borderColor:
                        statusModal.status === s ? theme.colors.primary : theme.colors.border,
                      backgroundColor:
                        statusModal.status === s
                          ? theme.scheme === "light"
                            ? "rgba(124,58,237,0.08)"
                            : "rgba(124,58,237,0.18)"
                          : theme.colors.background,
                    }}
                  >
                    <ThemedText variant="label" color="primary">
                      {orderStatusLabel(s)}
                    </ThemedText>
                  </PressableScale>
                ))
              : null}
            <PressableScale
              accessibilityLabel="Close"
              onPress={() => setStatusModal(null)}
              style={{ alignItems: "center", paddingVertical: 12 }}
            >
              <ThemedText variant="caption" color="muted">
                Cancel
              </ThemedText>
            </PressableScale>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

function OrderCard({
  order,
  busy,
  onChangeStatus,
}: {
  order: SupplierOrder;
  busy: boolean;
  onChangeStatus: () => void;
}) {
  const theme = useTheme();
  const when = new Date(order.created_at).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <View
      style={{
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        padding: 16,
        gap: 12,
        backgroundColor: theme.colors.surface,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        <View style={{ flex: 1, gap: 4 }}>
          <ThemedText variant="caption" color="muted">
            {when}
          </ThemedText>
          <ThemedText variant="headline">${(order.total_cents / 100).toFixed(2)}</ThemedText>
        </View>
        <PressableScale
          accessibilityLabel="Change order status"
          onPress={() => {
            if (busy) return;
            onChangeStatus();
          }}
          style={{
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: theme.radius.pill,
            borderWidth: 1,
            borderColor: theme.colors.primary,
          }}
        >
          <ThemedText variant="caption" color="primary">
            {busy ? "…" : orderStatusLabel(order.status)}
          </ThemedText>
        </PressableScale>
      </View>

      <View style={{ gap: 10 }}>
        {order.order_items.map((line) => (
          <View
            key={line.id}
            style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
          >
            <Image
              source={{ uri: line.image_url }}
              style={{ width: 44, height: 44, borderRadius: theme.radius.sm }}
              contentFit="cover"
            />
            <View style={{ flex: 1 }}>
              <ThemedText variant="label" numberOfLines={2}>
                {line.title}
              </ThemedText>
              <ThemedText variant="caption" color="muted">
                {line.qty} × ${(line.unit_price_cents / 100).toFixed(2)}
              </ThemedText>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
