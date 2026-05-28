import { useMemo, useState } from "react";
import { ActivityIndicator, Alert, FlatList, View } from "react-native";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { OrderPartyBadge } from "@/components/order-card/OrderPartyBadge";
import { ReturnsEmptyState } from "@/components/order-card/ReturnsEmptyState";
import { ReturnRequestsGroupedList } from "@/components/ReturnRequestsGroupedList";
import {
  countReturnStatusFilters,
  ReturnStatusFilterChips,
  type ReturnStatusFilter,
} from "@/components/ReturnStatusFilterChips";
import { ReturnResolutionSheet } from "@/components/ReturnResolutionSheet";
import { PressableScale } from "@/components/PressableScale";
import { Screen } from "@/components/Screen";
import { SupplierHeaderActions } from "@/components/SupplierHeaderActions";
import { ThemedText } from "@/components/ThemedText";
import { useReturnsScreenRealtime } from "@/hooks/useReturnsScreenRealtime";
import { useSupplierReturns, type ReturnRequestRow } from "@/hooks/useReturnRequests";
import { isSupabaseConfigured } from "@/lib/is-supabase-configured";
import type { ReturnResolution } from "@/lib/return-resolution";
import { groupReturnRequestsByOrder } from "@/lib/return-list-grouping";
import { resolveReturnRequest } from "@/lib/returns-remote";
import { useSessionStore } from "@/stores/session-store";
import { useTheme } from "@/theme/ThemeContext";

type ReturnResolveTarget = {
  requestId: string;
  productTitle: string;
  qty: number;
  unitPriceCents: number;
  reason: string | null;
};

function shopperLabel(request: ReturnRequestRow): string {
  const n = request.customer?.full_name?.trim();
  if (n) return n;
  return `Shopper · ${request.customer_id.slice(0, 8)}…`;
}

function shopperParty(request: ReturnRequestRow) {
  return {
    name: request.customer?.full_name ?? "",
    avatarUrl: request.customer?.avatar_url ?? null,
    fallbackLabel: "Shopper",
  };
}

export default function SupplierReturnsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const theme = useTheme();
  const supplierId = useSessionStore((s) => s.userId);
  const { data: returns = [], isPending, error, isFetching } = useSupplierReturns(supplierId);
  useReturnsScreenRealtime("supplier", supplierId);
  const [statusFilter, setStatusFilter] = useState<ReturnStatusFilter>("all");
  const [resolveTarget, setResolveTarget] = useState<ReturnResolveTarget | null>(null);
  const [resolveBusyId, setResolveBusyId] = useState<string | null>(null);

  const filteredReturns = useMemo(() => {
    if (statusFilter === "all") return returns;
    return returns.filter((r) => r.status === statusFilter);
  }, [returns, statusFilter]);

  const filterCounts = useMemo(
    () => countReturnStatusFilters(returns.map((r) => r.status)),
    [returns],
  );

  const pendingTotal = filterCounts.requested;

  const sections = useMemo(() => {
    const byCustomer = new Map<string, ReturnRequestRow[]>();
    for (const r of filteredReturns) {
      const list = byCustomer.get(r.customer_id) ?? [];
      list.push(r);
      byCustomer.set(r.customer_id, list);
    }
    return Array.from(byCustomer.entries())
      .map(([customerId, list]) => {
        const orderGroups = groupReturnRequestsByOrder(list);
        const pending = list.filter((r) => r.status === "requested").length;
        const first = list[0]!;
        return {
          customerId,
          party: shopperParty(first),
          title: shopperLabel(first),
          pending,
          orderGroups,
          requestCount: list.length,
        };
      })
      .sort((a, b) => {
        if (a.pending !== b.pending) return b.pending - a.pending;
        const aLatest = a.orderGroups[0]?.latestAt ?? "";
        const bLatest = b.orderGroups[0]?.latestAt ?? "";
        return new Date(bLatest).getTime() - new Date(aLatest).getTime();
      });
  }, [filteredReturns]);

  function openResolve(request: ReturnRequestRow) {
    setResolveTarget({
      requestId: request.id,
      productTitle: request.order_item.title,
      qty: request.qty,
      unitPriceCents: request.order_item.unit_price_cents,
      reason: request.reason,
    });
  }

  async function applyReturnResolution(
    resolution: Exclude<ReturnResolution, "pending">,
    refundCents: number,
    note: string,
  ) {
    if (!resolveTarget || !supplierId) return;
    setResolveBusyId(resolveTarget.requestId);
    try {
      await resolveReturnRequest(resolveTarget.requestId, resolution, refundCents, note);
      void queryClient.refetchQueries({ queryKey: ["supplier-returns", supplierId] });
      void queryClient.refetchQueries({ queryKey: ["supplier-orders", supplierId] });
      void queryClient.invalidateQueries({ queryKey: ["customer-returns"] });
      setResolveTarget(null);
      Alert.alert("Return resolved", "The shopper will see your decision on this request.");
    } catch (e) {
      Alert.alert("Could not resolve", (e as Error).message);
    } finally {
      setResolveBusyId(null);
    }
  }

  if (!isSupabaseConfigured()) {
    return (
      <Screen>
        <ThemedText variant="body" color="muted">
          Connect Supabase to manage shopper return and refund requests.
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
            Returns
          </ThemedText>
        </View>
        <SupplierHeaderActions />
      </View>

      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 12,
          gap: 8,
        }}
      >
        <ThemedText variant="caption" color="muted" style={{ flex: 1 }}>
          {pendingTotal > 0
            ? `${pendingTotal} request${pendingTotal === 1 ? "" : "s"} need your review.`
            : "All return requests are resolved."}{" "}
          Grouped by shopper, order, and line — updates live.
        </ThemedText>
        {isFetching && !isPending ? (
          <ActivityIndicator size="small" color={theme.colors.primary} />
        ) : null}
      </View>

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
        <ReturnsEmptyState
          variant="supplier"
          kind="empty"
          onPrimaryPress={() => router.push("/(supplier)/orders")}
        />
      ) : sections.length === 0 ? (
        <ReturnsEmptyState
          variant="supplier"
          kind="filtered"
          statusFilter={statusFilter}
          onClearFilter={() => setStatusFilter("all")}
        />
      ) : (
        <FlatList
          data={sections}
          keyExtractor={(s) => s.customerId}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 32 }}
          renderItem={({ item: section }) => (
            <View
              style={{
                marginBottom: 20,
                paddingBottom: 20,
                borderBottomWidth: 1,
                borderBottomColor: theme.colors.border,
              }}
            >
              <View style={{ gap: 4, marginBottom: 14 }}>
                <OrderPartyBadge party={section.party} />
                <ThemedText variant="caption" color="muted">
                  {section.orderGroups.length} order{section.orderGroups.length === 1 ? "" : "s"} ·{" "}
                  {section.requestCount} request{section.requestCount === 1 ? "" : "s"}
                  {section.pending > 0 ? ` · ${section.pending} pending` : ""}
                </ThemedText>
              </View>
              <ReturnRequestsGroupedList
                orderGroups={section.orderGroups}
                role="supplier"
                resolveBusyId={resolveBusyId}
                onResolve={(request) => openResolve(request)}
              />
            </View>
          )}
        />
      )}

      <ReturnResolutionSheet
        visible={resolveTarget != null}
        productTitle={resolveTarget?.productTitle ?? ""}
        qty={resolveTarget?.qty ?? 1}
        unitPriceCents={resolveTarget?.unitPriceCents ?? 0}
        reason={resolveTarget?.reason ?? null}
        saving={resolveBusyId != null}
        onResolve={(resolution, refundCents, note) =>
          void applyReturnResolution(resolution, refundCents, note)
        }
        onClose={() => {
          if (resolveBusyId) return;
          setResolveTarget(null);
        }}
      />
    </Screen>
  );
}
