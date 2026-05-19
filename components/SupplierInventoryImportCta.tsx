import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { PressableScale } from "@/components/PressableScale";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/theme/ThemeContext";

type Props = {
  onPress: () => void;
};

/** Primary bulk-import action — shared by empty and populated inventory screens. */
export function SupplierInventoryImportCta({ onPress }: Props) {
  const theme = useTheme();

  return (
    <View style={styles.wrap}>
      <PressableScale
        accessibilityLabel="Add your inventory from a spreadsheet"
        scaleOnPress={false}
        onPress={onPress}
        style={styles.shadow}
      >
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <View style={styles.iconBadge}>
            <Ionicons name="cloud-upload-outline" size={20} color={theme.colors.textOnPrimary} />
          </View>
          <View style={styles.copy}>
            <ThemedText variant="label" color="onPrimary">
              Add your Inventory
            </ThemedText>
            <ThemedText variant="caption" color="onPrimary" style={styles.caption}>
              Bulk import from .csv or .xlsx
            </ThemedText>
          </View>
        </LinearGradient>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: "100%" },
  shadow: {
    borderRadius: 999,
    shadowColor: "#7C3AED",
    shadowOpacity: 0.26,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  gradient: {
    borderRadius: 999,
    paddingVertical: 14,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  copy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  caption: {
    opacity: 0.92,
    lineHeight: 18,
  },
});
