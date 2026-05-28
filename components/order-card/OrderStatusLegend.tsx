import { View } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import {
  ORDER_STATUSES,
  orderStatusColor,
  orderStatusLabel,
  shopperDisplayStatusColor,
  shopperDisplayStatusLabel,
  type ShopperReturnDisplayStatus,
} from "@/lib/order-status";
import { useTheme } from "@/theme/ThemeContext";

const RETURN_STATUSES: ShopperReturnDisplayStatus[] = [
  "return_requested",
  "return_approved",
  "returned",
];

function LegendSwatch({ color }: { color: string }) {
  return (
    <View
      style={{
        width: 9,
        height: 9,
        borderRadius: 5,
        backgroundColor: color,
        borderWidth: 1,
        borderColor: color,
      }}
    />
  );
}

function LegendItem({ label, color }: { label: string; color: string }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        marginRight: 12,
        marginBottom: 8,
      }}
    >
      <LegendSwatch color={color} />
      <ThemedText variant="caption" color="muted" style={{ fontSize: 11, lineHeight: 14 }}>
        {label}
      </ThemedText>
    </View>
  );
}

/** Status color key for order screens (replaces instructional caption). */
export function OrderStatusLegend() {
  const scheme = useTheme().scheme;

  return (
    <View style={{ marginBottom: 16, gap: 10 }}>
      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
        {ORDER_STATUSES.map((status) => (
          <LegendItem
            key={status}
            label={orderStatusLabel(status)}
            color={orderStatusColor(status, scheme)}
          />
        ))}
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
        {RETURN_STATUSES.map((status) => (
          <LegendItem
            key={status}
            label={shopperDisplayStatusLabel(status)}
            color={shopperDisplayStatusColor(status, scheme)}
          />
        ))}
      </View>
    </View>
  );
}
