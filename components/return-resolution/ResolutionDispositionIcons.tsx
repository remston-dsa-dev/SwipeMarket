import { View } from "react-native";
import { DispositionChip } from "@/components/return-resolution/DispositionChip";
import {
  refundChipStyle,
  returnChipStyle,
} from "@/components/return-resolution/disposition-chip-styles";
import type { RefundKind } from "@/lib/return-resolution";
import { useTheme } from "@/theme/ThemeContext";

type Props = {
  returnAccepted: boolean;
  refundKind: RefundKind;
};

/** Small filled return + payment disposition icons. */
export function ResolutionDispositionIcons({ returnAccepted, refundKind }: Props) {
  const isDark = useTheme().scheme === "dark";

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      <DispositionChip style={returnChipStyle(returnAccepted, isDark)} />
      <DispositionChip style={refundChipStyle(refundKind, isDark)} />
    </View>
  );
}
