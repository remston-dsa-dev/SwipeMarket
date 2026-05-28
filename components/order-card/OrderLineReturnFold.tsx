import { useMemo, useState, type ReactNode } from "react";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { PressableScale } from "@/components/PressableScale";
import { ThemedText } from "@/components/ThemedText";
import {
  formatReturnWarrantyExpiresAt,
  formatReturnWarrantyRemaining,
  getReturnWarrantySnapshot,
  isLineReturnEligible,
  linePendingReturnQty,
  RETURN_WARRANTY_DAYS,
  type OrderLineFields,
} from "@/lib/order-line";
import { DispositionChip } from "@/components/return-resolution/DispositionChip";
import { ReturnDispositionSummary } from "@/components/return-resolution/ReturnDispositionSummary";
import { ReturnPaymentDispositionLabels } from "@/components/return-resolution/ReturnPaymentDispositionLabels";
import { pendingChipStyle } from "@/components/return-resolution/disposition-chip-styles";
import {
  getResolutionDisposition,
  refundDisplayText,
  returnResolutionLabel,
  type RefundKind,
  type ReturnResolution,
} from "@/lib/return-resolution";
import { resolveStatusTone, TONE_PLACED, TONE_PROCESSING } from "@/lib/status-colors";
import { useTheme } from "@/theme/ThemeContext";
import type { LineReturnRequestSummary } from "@/lib/order-line";

type Props = {
  line: OrderLineFields;
  productTitle: string;
  /** Shared screen clock — do not run a per-row timer in lists. */
  warrantyNow: number;
  onRequestReturn?: () => void;
  returnBusy?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
};

type FoldTone = "eligible" | "pending" | "resolved" | "ended";

const RETURN_ICON: ComponentProps<typeof Ionicons>["name"] = "arrow-undo-circle";

type FoldState = {
  tone: FoldTone;
  icon: ComponentProps<typeof Ionicons>["name"];
  primary: string;
  secondary?: string;
};

function toneIconColor(theme: ReturnType<typeof useTheme>, tone: FoldTone): string {
  const scheme = theme.scheme;
  switch (tone) {
    case "pending":
      return resolveStatusTone(TONE_PROCESSING, scheme);
    case "resolved":
      return resolveStatusTone(TONE_PLACED, scheme);
    case "ended":
      return theme.colors.textSecondary;
    case "eligible":
    default:
      return scheme === "dark" ? "#A78BFA" : theme.colors.primary;
  }
}

function getFoldState(line: OrderLineFields, now: number): FoldState | null {
  const pendingQty = linePendingReturnQty(line);
  const resolved = (line.return_requests ?? []).filter((r) => r.status === "resolved");
  const last = resolved[resolved.length - 1];
  const warranty = getReturnWarrantySnapshot(line.shipped_at, now);

  if (pendingQty > 0) {
    return {
      tone: "pending",
      icon: "time",
      primary: `Partner reviewing ${pendingQty} unit${pendingQty === 1 ? "" : "s"}`,
      secondary: "You'll see their decision here when they respond",
    };
  }

  if (last) {
    return {
      tone: "resolved",
      icon: "checkmark-circle",
      primary: returnResolutionLabel(last.resolution as ReturnResolution),
      secondary: new Date(last.created_at).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    };
  }

  if (isLineReturnEligible(line, now) && warranty) {
    return {
      tone: "eligible",
      icon: RETURN_ICON,
      primary: `${formatReturnWarrantyRemaining(warranty)} to request a return or refund`,
      secondary: `Closes ${formatReturnWarrantyExpiresAt(warranty.expiresAtMs)} · ${RETURN_WARRANTY_DAYS}-day window`,
    };
  }

  if (line.status === "delivered" && warranty?.windowEnded) {
    return {
      tone: "ended",
      icon: "lock-closed",
      primary: "Return window ended — new requests not accepted",
      secondary: `Closed ${formatReturnWarrantyExpiresAt(warranty.expiresAtMs)}`,
    };
  }

  return null;
}

function hasReturnSection(line: OrderLineFields, now: number): boolean {
  const pending = linePendingReturnQty(line);
  const resolved = (line.return_requests ?? []).filter((r) => r.status === "resolved");
  if (pending > 0 || resolved.length > 0 || line.return_qty > 0) return true;
  if (line.status !== "delivered") return false;
  const warranty = getReturnWarrantySnapshot(line.shipped_at, now);
  return isLineReturnEligible(line, now) || !!warranty;
}

function ActivityRow({ children }: { children: ReactNode }) {
  return (
    <View style={{ paddingLeft: 0 }}>
      {typeof children === "string" ? (
        <ThemedText variant="caption" color="muted" style={{ lineHeight: 17 }}>
          {children}
        </ThemedText>
      ) : (
        children
      )}
    </View>
  );
}

function FoldLeadingIcon({
  tone,
  isDark,
  iconColor,
  foldIcon,
}: {
  tone: FoldTone;
  isDark: boolean;
  iconColor: string;
  foldIcon: ComponentProps<typeof Ionicons>["name"];
}) {
  if (tone === "pending") {
    return <DispositionChip style={pendingChipStyle(isDark)} />;
  }
  if (tone === "resolved") {
    return null;
  }
  return (
    <Ionicons name={foldIcon} size={15} color={iconColor} style={{ marginTop: 1, flexShrink: 0 }} />
  );
}

export function OrderLineReturnFold({
  line,
  productTitle,
  warrantyNow,
  onRequestReturn,
  returnBusy,
  onExpandedChange,
}: Props) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);

  function setFoldExpanded(next: boolean) {
    setExpanded(next);
    onExpandedChange?.(next);
  }
  const now = warrantyNow;

  const warranty = useMemo(
    () => getReturnWarrantySnapshot(line.shipped_at, now),
    [line.shipped_at, now],
  );
  const fold = useMemo(() => getFoldState(line, now), [line, now]);
  const show = useMemo(() => hasReturnSection(line, now) && fold != null, [line, now, fold]);
  const eligible = isLineReturnEligible(line, now);
  const pendingQty = linePendingReturnQty(line);
  const resolvedReturns = (line.return_requests ?? []).filter((r) => r.status === "resolved");
  const lastResolved = resolvedReturns[resolvedReturns.length - 1];
  const resolvedDisposition = lastResolved
    ? getResolutionDisposition(lastResolved.resolution as ReturnResolution, {
        returnAccepted: lastResolved.return_accepted,
        refundKind: lastResolved.refund_kind,
      })
    : null;
  const iconColor = fold ? toneIconColor(theme, fold.tone) : theme.colors.textSecondary;
  const isDark = theme.scheme === "dark";

  if (!show || !fold) return null;

  const divider = theme.colors.border;

  return (
    <View
      style={{
        alignSelf: "stretch",
        width: "100%",
        marginBottom: 10,
        paddingTop: 4,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: divider,
      }}
    >
      <PressableScale
        accessibilityLabel={
          expanded
            ? `Collapse return details for ${productTitle}`
            : `Expand return details for ${productTitle}, ${fold.primary}`
        }
        onPress={() => setFoldExpanded(!expanded)}
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
          gap: 8,
          paddingVertical: 6,
        }}
      >
        {fold.tone !== "resolved" ? (
          <FoldLeadingIcon
            tone={fold.tone}
            isDark={isDark}
            iconColor={iconColor}
            foldIcon={fold.icon}
          />
        ) : null}

        <View style={{ flex: 1, gap: 2, minWidth: 0 }}>
          {fold.tone === "resolved" && resolvedDisposition && lastResolved ? (
            <ReturnPaymentDispositionLabels
              returnAccepted={resolvedDisposition.returnAccepted}
              refundKind={resolvedDisposition.refundKind}
              refundCents={lastResolved.refund_cents}
            />
          ) : fold.tone === "resolved" && lastResolved ? (
            <ThemedText variant="caption" color="secondary" style={{ fontWeight: "600", lineHeight: 17 }}>
              {returnResolutionLabel(lastResolved.resolution as ReturnResolution)}
              {lastResolved.refund_kind !== "none" && lastResolved.refund_cents > 0
                ? ` · ${refundDisplayText(lastResolved.refund_kind as RefundKind, lastResolved.refund_cents)}`
                : ""}
            </ThemedText>
          ) : (
            <>
              <ThemedText
                variant="caption"
                color="secondary"
                numberOfLines={3}
                style={{ fontWeight: "600", lineHeight: 17 }}
              >
                {fold.primary}
              </ThemedText>
              {fold.secondary ? (
                <ThemedText variant="caption" color="muted" numberOfLines={2} style={{ lineHeight: 16 }}>
                  {fold.secondary}
                </ThemedText>
              ) : null}
            </>
          )}
        </View>

        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={14}
          color={theme.colors.textSecondary}
          style={{ flexShrink: 0, marginTop: 2, opacity: 0.7 }}
        />
      </PressableScale>

      {expanded ? (
        <View style={{ gap: 8, paddingBottom: 2, paddingLeft: 23 }}>
          {eligible && warranty && !warranty.windowEnded ? (
            <ActivityRow>
              <ThemedText variant="caption" color="muted" style={{ lineHeight: 17 }}>
                {formatReturnWarrantyRemaining(warranty)} remaining (updates live). Window ends{" "}
                {formatReturnWarrantyExpiresAt(warranty.expiresAtMs)}.
              </ThemedText>
            </ActivityRow>
          ) : null}

          {resolvedReturns.length > 1
            ? resolvedReturns.slice(0, -1).map((r) => {
                const when = new Date(r.created_at).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                });
                return (
                  <ActivityRow key={r.id}>
                    <ReturnDispositionSummary
                      status="resolved"
                      resolution={r.resolution}
                      returnAccepted={r.return_accepted}
                      refundKind={r.refund_kind}
                      refundCents={r.refund_cents}
                      subtitle={when}
                    />
                  </ActivityRow>
                );
              })
            : null}

          {pendingQty > 0 ? (
            <ActivityRow>
              Your partner will accept, partially refund, deny, or approve without refund.
            </ActivityRow>
          ) : null}

          {eligible && onRequestReturn ? (
            <PressableScale
              accessibilityLabel={`Request return for ${productTitle}`}
              onPress={onRequestReturn}
              disabled={returnBusy}
              style={{
                alignSelf: "stretch",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                marginTop: 2,
                paddingVertical: 9,
                paddingHorizontal: 12,
                borderRadius: theme.radius.sm,
                borderWidth: 1,
                borderColor: theme.colors.primary,
                backgroundColor: "transparent",
                opacity: returnBusy ? 0.55 : 1,
              }}
            >
              <Ionicons name={RETURN_ICON} size={15} color={iconColor} />
              <ThemedText variant="caption" color="primary" style={{ fontWeight: "600" }}>
                {returnBusy ? "Submitting…" : "Request return / refund"}
              </ThemedText>
            </PressableScale>
          ) : null}

          {fold.tone === "resolved" && fold.secondary ? (
            <ActivityRow>
              <ThemedText variant="caption" color="muted" style={{ lineHeight: 16 }}>
                Resolved {fold.secondary}
              </ThemedText>
            </ActivityRow>
          ) : null}

          {fold.tone === "ended" ? (
            <ActivityRow>
              Earlier returns on this line stay visible above if already resolved.
            </ActivityRow>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
