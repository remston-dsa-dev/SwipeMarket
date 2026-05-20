import { View } from "react-native";
import { DispositionChip } from "@/components/return-resolution/DispositionChip";
import {
  refundChipStyle,
  returnChipStyle,
} from "@/components/return-resolution/disposition-chip-styles";
import { ThemedText } from "@/components/ThemedText";
import { refundDisplayText, returnDispositionText, type RefundKind } from "@/lib/return-resolution";
import { useTheme } from "@/theme/ThemeContext";

type Props = {
  returnAccepted: boolean;
  refundKind: RefundKind;
  refundCents?: number;
  /** Used when refund is full and amount not set yet (e.g. resolve sheet). */
  lineTotalCents?: number;
};

function DispositionSegment({
  chipStyle,
  label,
  mutedLabel,
}: {
  chipStyle: ReturnType<typeof returnChipStyle>;
  label: string;
  mutedLabel?: boolean;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexShrink: 0 }}>
      <DispositionChip style={chipStyle} />
      <ThemedText
        variant="caption"
        color={mutedLabel ? "muted" : "primary"}
        numberOfLines={1}
        style={{ fontWeight: "600", lineHeight: 17 }}
      >
        {label}
      </ThemedText>
    </View>
  );
}

/** One line: return chip + label · refund chip + amount. */
export function ReturnPaymentDispositionLabels({
  returnAccepted,
  refundKind,
  refundCents = 0,
  lineTotalCents,
}: Props) {
  const isDark = useTheme().scheme === "dark";
  const refundText = refundDisplayText(refundKind, refundCents, lineTotalCents);

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "stretch",
        flexWrap: "wrap",
        columnGap: 8,
        rowGap: 6,
      }}
    >
      <DispositionSegment
        chipStyle={returnChipStyle(returnAccepted, isDark)}
        label={returnDispositionText(returnAccepted)}
      />

      <ThemedText variant="caption" color="muted" style={{ lineHeight: 17 }}>
        ·
      </ThemedText>

      <DispositionSegment
        chipStyle={refundChipStyle(refundKind, isDark)}
        label={refundText}
        mutedLabel={refundKind === "none"}
      />
    </View>
  );
}
