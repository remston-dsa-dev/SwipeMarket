import { useMemo, useState } from "react";
import { ActivityIndicator, Alert, FlatList, View } from "react-native";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { OrderPartyBadge } from "@/components/order-card/OrderPartyBadge";
import { ReturnRequestCard } from "@/components/ReturnRequestCard";
import { ReturnResolutionSheet } from "@/components/ReturnResolutionSheet";
import { PressableScale } from "@/components/PressableScale";
import { Screen } from "@/components/Screen";
import { SupplierHeaderActions } from "@/components/SupplierHeaderActions";
import { ThemedText } from "@/components/ThemedText";
import { useSupplierReturns, type ReturnRequestRow } from "@/hooks/useReturnRequests";
import { isSupabaseConfigured } from "@/lib/is-supabase-configured";
import type { ReturnResolution } from "@/lib/return-resolution";
import { resolveReturnRequest } from "@/lib/returns-remote";
import { useSessionStore } from "@/stores/session-store";
import { useTheme } from "@/theme/ThemeContext";

type StatusFilter = "all" | "requested" | "resolved";

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
  const { data: returns = [], isPending, error } = useSupplierReturns(supplierId);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [resolveTarget, setResolveTarget] = useState<ReturnResolveTarget | null>(null);
  const [resolveBusyId, setResolveBusyId] = useState<string | null>(null);

  const filteredReturns = useMemo(() => {
    if (statusFilter === "all") return returns;
    return returns.filter((r) => r.status === statusFilter);
  }, [returns, statusFilter]);

  const pendingTotal = useMemo(
    () => returns.filter((r) => r.status === "requested").length,
    [returns],
  );

  const sections = useMemo(() => {
    const byCustomer = new Map<string, ReturnRequestRow[]>();
    for (const r of filteredReturns) {
      const list = byCustomer.get(r.customer_id) ?? [];
      list.push(r);
      byCustomer.set(r.customer_id, list);
    }
    return Array.from(byCustomer.entries())
      .map(([customerId, list]) => {
        const sorted = [...list].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
        const pending = sorted.filter((r) => r.status === "requested").length;
        return {
          customerId,
          party: shopperParty(sorted[0]!),
          title: shopperLabel(sorted[0]!),
          pending,
          data: sorted,
        };
      })
      .sort((a, b) => {
        if (a.pending !== b.pending) return b.pending - a.pending;
        return (
          new Date(b.data[0]!.created_at).getTime() - new Date(a.data[0]!.created_at).getTime()
        );
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
      void queryClient.invalidateQueries({ queryKey: ["supplier-returns", supplierId] });
      void queryClient.invalidateQueries({ queryKey: ["supplier-orders", supplierId] });
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

      <ThemedText variant="caption" color="muted" style={{ marginBottom: 12 }}>
        {pendingTotal > 0
          ? `${pendingTotal} request${pendingTotal === 1 ? "" : "s"} need your review.`
          : "All return requests are resolved."}{" "}
        Grouped by shopper below.
      </ThemedText>

      <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
        {(
          [
            { key: "all", label: "All" },
            { key: "requested", label: "Pending" },
            { key: "resolved", label: "Resolved" },
          ] as const
        ).map((f) => (
          <PressableScale
            key={f.key}
            accessibilityLabel={`Filter ${f.label}`}
            onPress={() => setStatusFilter(f.key)}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: theme.radius.pill,
              borderWidth: 1,
              borderColor: statusFilter === f.key ? theme.colors.primary : theme.colors.border,
              backgroundColor:
                statusFilter === f.key ? theme.colors.primary : theme.colors.surface,
            }}
          >
            <ThemedText variant="caption" color={statusFilter === f.key ? "onPrimary" : "primary"}>
              {f.label}
            </ThemedText>
          </PressableScale>
        ))}
      </View>

      {isPending ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : error ? (
        <ThemedText variant="body" style={{ color: "#EF4444" }}>
          {(error as Error).message}
        </ThemedText>
      ) : sections.length === 0 ? (
        <View style={{ flex: 1, justifyContent: "center", gap: 12 }}>
          <ThemedText variant="body" color="muted">
            {returns.length === 0
              ? "No return requests yet. When shoppers request a return on a delivered item, they appear here grouped by shopper."
              : "No return requests match this filter."}
          </ThemedText>
          {returns.length === 0 ? (
            <PressableScale
              onPress={() => router.push("/(supplier)/orders")}
              style={{
                alignSelf: "flex-start",
                paddingHorizontal: 18,
                paddingVertical: 12,
                borderRadius: theme.radius.md,
                backgroundColor: theme.colors.primary,
              }}
            >
              <ThemedText variant="label" color="onPrimary">
                View orders
              </ThemedText>
            </PressableScale>
          ) : null}
        </View>
      ) : (
        <FlatList
          data={sections}
          keyExtractor={(s) => s.customerId}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ gap: 24, paddingBottom: 32 }}
          renderItem={({ item: section }) => (
            <View style={{ gap: 12 }}>
              <View style={{ gap: 8 }}>
                <OrderPartyBadge party={section.party} />
                <ThemedText variant="caption" color="muted">
                  {section.data.length} request{section.data.length === 1 ? "" : "s"}
                  {section.pending > 0
                    ? ` · ${section.pending} pending`
                    : ""}
                </ThemedText>
              </View>
              {section.data.map((request) => (
                <ReturnRequestCard
                  key={request.id}
                  request={request}
                  role="supplier"
                  hidePartyBadge
                  busy={resolveBusyId === request.id}
                  onResolve={
                    request.status === "requested" ? () => openResolve(request) : undefined
                  }
                />
              ))}
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
