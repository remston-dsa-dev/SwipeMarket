import type { ReactNode } from "react";
import { LinearGradient } from "expo-linear-gradient";
import type { StyleProp, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/theme/ThemeContext";

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function Screen({ children, style }: Props) {
  const theme = useTheme();
  return (
    <LinearGradient
      colors={[theme.colors.gradientStart, theme.colors.gradientEnd]}
      style={{ flex: 1 }}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView
        edges={["top", "bottom"]}
        style={[{ flex: 1, paddingHorizontal: 20 }, style]}
      >
        {children}
      </SafeAreaView>
    </LinearGradient>
  );
}
