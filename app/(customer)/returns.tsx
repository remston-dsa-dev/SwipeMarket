import { useMemo, useState } from "react";
import { ActivityIndicator, Alert, FlatList, View } from "react-native";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { CustomerHeaderActions } from "@/components/CustomerHeaderActions";
import { ReturnRequestCard } from "@/components/ReturnRequestCard";
import {
  countReturnStatusFilters,
  ReturnStatusFilterChips,
  type ReturnStatusFilter,
} from "@/components/ReturnStatusFilterChips";
import { PressableScale } from "@/components/PressableScale";
import { Screen } from "@/components/Screen";
import { ThemedText } from "@/components/ThemedText";
import { useCustomerReturns } from "@/hooks/useReturnRequests";
import { isSupabaseConfigured } from "@/lib/is-supabase-configured";
import { cancelReturnRequest } from "@/lib/returns-remote";
import { useSessionStore } from "@/stores/session-store";
import { useTheme } from "@/theme/ThemeContext";

export default function CustomerReturnsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const theme = useTheme();
  const customerId = useSessionStore((s) => s.userId);
  const { data: returns = [], isPending, error } = useCustomerReturns(customerId);
  const [statusFilter, setStatusFilter] = useState<ReturnStatusFilter>("all");
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const filterCounts = useMemo(
    () => countReturnStatusFilters(returns.map((r) => r.status)),
    [returns],
  );

  const filteredReturns = useMemo(() => {
    if (statusFilter === "all") return returns;
    return returns.filter((r) => r.status === statusFilter);
  }, [returns, statusFilter]);

  async function handleCancel(requestId: string) {
    if (!customerId) return;
    setCancellingId(requestId);
    try {
      await cancelReturnRequest(requestId);
      void queryClient.invalidateQueries({ queryKey: ["customer-returns", customerId] });
      void queryClient.invalidateQueries({ queryKey: ["customer-orders", customerId] });
    } catch (e) {
      Alert.alert("Could not cancel", (e as Error).message);
    } finally {
      setCancellingId(null);
    }
  }

  if (!isSupabaseConfigured()) {
    return (
      <Screen>
        <ThemedText variant="body" color="muted">
          Connect Supabase to manage return and refund requests.
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
            My Returns
          </ThemedText>
        </View>
        <CustomerHeaderActions />
      </View>

      <ThemedText variant="caption" color="muted" style={{ marginBottom: 12 }}>
        Request returns from My Orders on delivered items. Each partner reviews and resolves with
        their chosen refund outcome.
      </ThemedText>

      {returns.length > 0 ? (
        <ReturnStatusFilterChips
          value={statusFilter}
          onChange={setStatusFilter}
          counts={filterCounts}
        />
      ) : null}

      {isPending ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : error ? (
        <ThemedText variant="body" style={{ color: "#EF4444" }}>
          {(error as Error).message}
        </ThemedText>
      ) : returns.length === 0 ? (
        <View style={{ flex: 1, justifyContent: "center", gap: 12 }}>
          <ThemedText variant="body" color="muted">
            No return requests yet. Open a delivered order and tap Request return / refund on an
            eligible product line.
          </ThemedText>
          <PressableScale
            onPress={() => router.push("/(customer)/orders")}
            style={{
              alignSelf: "flex-start",
              paddingHorizontal: 18,
              paddingVertical: 12,
              borderRadius: theme.radius.md,
              backgroundColor: theme.colors.primary,
            }}
          >
            <ThemedText variant="label" color="onPrimary">
              View my orders
            </ThemedText>
          </PressableScale>
        </View>
      ) : filteredReturns.length === 0 ? (
        <View style={{ flex: 1, justifyContent: "center" }}>
          <ThemedText variant="body" color="muted">
            No return requests match this filter.
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={filteredReturns}
          keyExtractor={(r) => r.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ gap: 12, paddingBottom: 32 }}
          renderItem={({ item }) => (
            <ReturnRequestCard
              request={item}
              role="customer"
              busy={cancellingId === item.id}
              onCancel={
                item.status === "requested"
                  ? () => void handleCancel(item.id)
                  : undefined
              }
            />
          )}
        />
      )}
    </Screen>
  );
}
