import { useMemo } from "react";
import { ActivityIndicator, FlatList, View } from "react-native";
import { useRouter } from "expo-router";
import { CustomerHeaderActions } from "@/components/CustomerHeaderActions";
import { ShopperOrderCard } from "@/components/ShopperOrderCard";
import { PressableScale } from "@/components/PressableScale";
import { Screen } from "@/components/Screen";
import { ThemedText } from "@/components/ThemedText";
import { useCustomerOrders, type CustomerOrder } from "@/hooks/useCustomerOrders";
import { isSupabaseConfigured } from "@/lib/is-supabase-configured";
import { useSessionStore } from "@/stores/session-store";
import { useTheme } from "@/theme/ThemeContext";

function partnerLabel(order: CustomerOrder): string {
  const n = order.supplier?.full_name?.trim();
  if (n) return n;
  return `Partner · ${order.supplier_id.slice(0, 8)}…`;
}

export default function CustomerOrdersScreen() {
  const router = useRouter();
  const theme = useTheme();
  const customerId = useSessionStore((s) => s.userId);
  const { data: orders = [], isPending, error } = useCustomerOrders(customerId);

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
        Status updates when your partner moves the order along. Pull to refresh is not required—updates
        stream in when available.
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
                <ShopperOrderCard key={order.id} order={order} />
              ))}
            </View>
          )}
        />
      )}
    </Screen>
  );
}

