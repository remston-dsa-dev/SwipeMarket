import { useMemo, useState } from "react";
import { ActivityIndicator, Alert, FlatList, View } from "react-native";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { CustomerHeaderActions } from "@/components/CustomerHeaderActions";
import { ReturnRequestSheet, type ReturnRequestLine } from "@/components/ReturnRequestSheet";
import { ShopperOrderCard } from "@/components/ShopperOrderCard";
import { PressableScale } from "@/components/PressableScale";
import { Screen } from "@/components/Screen";
import { ThemedText } from "@/components/ThemedText";
import { useCustomerOrders, type CustomerOrder, type CustomerOrderItem } from "@/hooks/useCustomerOrders";
import { isSupabaseConfigured } from "@/lib/is-supabase-configured";
import { isLineReturnEligible } from "@/lib/order-line";
import { createReturnRequest } from "@/lib/returns-remote";
import { useSessionStore } from "@/stores/session-store";
import { useTheme } from "@/theme/ThemeContext";

function partnerLabel(order: CustomerOrder): string {
  const n = order.supplier?.full_name?.trim();
  if (n) return n;
  return `Partner · ${order.supplier_id.slice(0, 8)}…`;
}

export default function CustomerOrdersScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const theme = useTheme();
  const customerId = useSessionStore((s) => s.userId);
  const { data: orders = [], isPending, error } = useCustomerOrders(customerId);
  const [returnLine, setReturnLine] = useState<CustomerOrderItem | null>(null);
  const [returnSaving, setReturnSaving] = useState(false);
  const [returnBusyLineId, setReturnBusyLineId] = useState<string | null>(null);

  async function submitReturn(qty: number, reason: string) {
    if (!returnLine || !customerId) return;
    if (!isLineReturnEligible(returnLine)) {
      Alert.alert("Return window ended", "The 30-day return period for this item has passed.");
      setReturnLine(null);
      return;
    }
    setReturnSaving(true);
    setReturnBusyLineId(returnLine.id);
    try {
      await createReturnRequest(returnLine.id, qty, reason);
      void queryClient.invalidateQueries({ queryKey: ["customer-orders", customerId] });
      void queryClient.invalidateQueries({ queryKey: ["customer-returns", customerId] });
      setReturnLine(null);
      Alert.alert("Request sent", "Your partner will review this return or refund request.");
    } catch (e) {
      Alert.alert("Could not submit", (e as Error).message);
    } finally {
      setReturnSaving(false);
      setReturnBusyLineId(null);
    }
  }

  const sections = useMemo(() => {
    const bySupplier = new Map<string, CustomerOrder[]>();
    for (const o of orders) {
      const list = bySupplier.get(o.supplier_id) ?? [];
      list.push(o);
      bySupplier.set(o.supplier_id, list);
    }
    return Array.from(bySupplier.entries())
      .map(([supplierId, list]) => ({
        supplierId,
        title: partnerLabel(list[0]!),
        data: [...list].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        ),
      }))
      .sort(
        (a, b) =>
          new Date(b.data[0]!.created_at).getTime() - new Date(a.data[0]!.created_at).getTime(),
      );
  }, [orders]);

  if (!isSupabaseConfigured()) {
    return (
      <Screen>
        <ThemedText variant="body" color="muted">
          Connect Supabase to see your orders and live status updates.
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
            accessibilityLabel="Back"
            onPress={() => router.back()}
            style={{ paddingVertical: 8, paddingHorizontal: 4 }}
          >
            <ThemedText variant="label">← Back</ThemedText>
          </PressableScale>
          <ThemedText variant="headline" numberOfLines={1} style={{ flex: 1 }}>
            My Orders
          </ThemedText>
        </View>
        <CustomerHeaderActions />
      </View>

      <ThemedText variant="caption" color="muted" style={{ marginBottom: 16 }}>
        Status updates stream in live. Expand Return on a delivered line to request a refund.
      </ThemedText>

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
            After you check out from your cart, each partner shipment appears here with live status.
          </ThemedText>
          <PressableScale
            onPress={() => router.replace("/(customer)/swipe")}
            style={{
              alignSelf: "flex-start",
              marginTop: 8,
              paddingHorizontal: 18,
              paddingVertical: 12,
              borderRadius: theme.radius.md,
              backgroundColor: theme.colors.primary,
            }}
          >
            <ThemedText variant="label" color="onPrimary">
              Start shopping
            </ThemedText>
          </PressableScale>
        </View>
      ) : (
        <FlatList
          data={sections}
          keyExtractor={(s) => s.supplierId}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ gap: 24, paddingBottom: 32 }}
          renderItem={({ item: section }) => (
            <View style={{ gap: 12 }}>
              <ThemedText variant="label" color="secondary">
                {section.title}
              </ThemedText>
              {section.data.map((order) => (
                <ShopperOrderCard
                  key={order.id}
                  order={order}
                  returnBusyLineId={returnBusyLineId}
                  onRequestReturn={(line) => {
                    if (!isLineReturnEligible(line)) {
                      Alert.alert(
                        "Return window ended",
                        "The 30-day return period for this item has passed.",
                      );
                      return;
                    }
                    setReturnLine(line);
                  }}
                />
              ))}
            </View>
          )}
        />
      )}
      <ReturnRequestSheet
        visible={returnLine != null}
        line={returnLine as ReturnRequestLine | null}
        saving={returnSaving}
        onSubmit={(qty, reason) => void submitReturn(qty, reason)}
        onClose={() => {
          if (returnSaving) return;
          setReturnLine(null);
        }}
      />
    </Screen>
  );
}

