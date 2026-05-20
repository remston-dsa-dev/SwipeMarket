import { View } from "react-native";
import { ReturnPaymentDispositionLabels } from "@/components/return-resolution/ReturnPaymentDispositionLabels";
import { ThemedText } from "@/components/ThemedText";
import {
  getResolutionDisposition,
  returnRequestStatusLabel,
  type ReturnRequestStatus,
  type ReturnResolution,
} from "@/lib/return-resolution";
import { DispositionChip } from "@/components/return-resolution/DispositionChip";
import { pendingChipStyle } from "@/components/return-resolution/disposition-chip-styles";
import { useTheme } from "@/theme/ThemeContext";

type Props = {
  status: ReturnRequestStatus;
  resolution?: ReturnResolution | string;
  returnAccepted?: boolean | null;
  refundKind?: string;
  refundCents?: number;
  subtitle?: string;
};

export function ReturnDispositionSummary({
  status,
  resolution,
  returnAccepted = null,
  refundKind = "none",
  refundCents = 0,
  subtitle,
}: Props) {
  const theme = useTheme();
  const isDark = theme.scheme === "dark";

  if (status === "requested") {
    return (
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
        <DispositionChip style={pendingChipStyle(isDark)} />
        <View style={{ flex: 1, gap: 2, minWidth: 0 }}>
          <ThemedText variant="caption" style={{ fontWeight: "600", lineHeight: 17 }}>
            {returnRequestStatusLabel(status)}
          </ThemedText>
          {subtitle ? (
            <ThemedText variant="caption" color="muted" style={{ lineHeight: 16 }}>
              {subtitle}
            </ThemedText>
          ) : null}
        </View>
      </View>
    );
  }

  if (status === "cancelled") {
    return (
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
        <DispositionChip
          style={{
            icon: "close-circle",
            label: "Cancelled",
            color: theme.colors.textSecondary,
            bg: isDark ? "rgba(148,163,184,0.18)" : "rgba(100,116,139,0.12)",
          }}
        />
        <ThemedText variant="caption" color="muted" style={{ flex: 1, lineHeight: 17 }}>
          {returnRequestStatusLabel(status)}
          {subtitle ? ` · ${subtitle}` : ""}
        </ThemedText>
      </View>
    );
  }

  const res = (resolution ?? "pending") as ReturnResolution;
  const disposition = getResolutionDisposition(res, { returnAccepted, refundKind });
  if (!disposition) {
    return (
      <ThemedText variant="caption" color="muted">
        {String(resolution)}
      </ThemedText>
    );
  }

  return (
    <View style={{ gap: 4 }}>
      <ReturnPaymentDispositionLabels
        returnAccepted={disposition.returnAccepted}
        refundKind={disposition.refundKind}
        refundCents={refundCents}
      />
      {subtitle ? (
        <ThemedText variant="caption" color="muted" style={{ lineHeight: 16 }}>
          {subtitle}
        </ThemedText>
      ) : null}
    </View>
  );
}
