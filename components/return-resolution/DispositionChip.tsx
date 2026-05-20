import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { DispositionChipStyle } from "@/components/return-resolution/disposition-chip-styles";

export const CHIP_SIZE = 22;
export const ICON_SIZE = 13;

export function DispositionChip({ style }: { style: DispositionChipStyle }) {
  return (
    <View
      accessibilityLabel={style.label}
      style={{
        width: CHIP_SIZE,
        height: CHIP_SIZE,
        borderRadius: CHIP_SIZE / 2,
        backgroundColor: style.bg,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Ionicons name={style.icon} size={ICON_SIZE} color={style.color} />
    </View>
  );
}
