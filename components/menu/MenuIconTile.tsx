import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { HubMenuIcon, type HubMenuIconName } from "@/components/menu/HubMenuIcon";
import { useTheme } from "@/theme/ThemeContext";

type Props = {
  name: HubMenuIconName;
  variant?: "default" | "danger";
  /** `hero` = empty-state centerpiece; `menu` = avatar sheet rows (default). */
  size?: "menu" | "hero";
};

const SIZES = {
  /** ~36pt tile, emoji near label (14px / 20 line) scale */
  menu: { tile: 36, ring: 2, emoji: 17, shadowRadius: 4, shadowOpacity: 0.14 },
  hero: { tile: 100, ring: 3, emoji: 52, shadowRadius: 8, shadowOpacity: 0.22 },
} as const;

/**
 * Hub menu emoji in a gradient ring + white inner disc.
 */
export function MenuIconTile({ name, variant = "default", size = "menu" }: Props) {
  const theme = useTheme();
  const dim = SIZES[size];
  const ringColors =
    variant === "danger"
      ? (["#F87171", "#DC2626"] as const)
      : ([theme.colors.primary, theme.colors.secondary] as const);

  const innerBg = theme.scheme === "light" ? "#FFFFFF" : theme.colors.surface;
  const innerRadius = (dim.tile - dim.ring * 2) / 2;

  return (
    <View
      style={[
        styles.outer,
        {
          width: dim.tile,
          height: dim.tile,
          shadowColor: variant === "danger" ? "#DC2626" : theme.colors.primary,
          shadowOpacity: dim.shadowOpacity,
          shadowRadius: dim.shadowRadius,
        },
      ]}
    >
      <LinearGradient
        colors={[...ringColors]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: dim.tile,
          height: dim.tile,
          borderRadius: dim.tile / 2,
          padding: dim.ring,
        }}
      >
        <View
          style={{
            flex: 1,
            borderRadius: innerRadius,
            backgroundColor: innerBg,
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          <HubMenuIcon name={name} size={dim.emoji} />
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
});
