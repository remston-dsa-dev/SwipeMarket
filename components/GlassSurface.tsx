import type { ReactNode } from "react";
import { BlurView } from "expo-blur";
import type { StyleProp, ViewStyle } from "react-native";
import { useTheme } from "@/theme/ThemeContext";

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function GlassSurface({ children, style }: Props) {
  const theme = useTheme();
  return (
    <BlurView
      intensity={theme.glassBlurIntensity}
      tint={theme.scheme === "dark" ? "dark" : "light"}
      style={[
        {
          borderRadius: theme.radius.md,
          borderWidth: 1,
          borderColor: theme.colors.glassBorder,
          overflow: "hidden",
        },
        style,
      ]}
    >
      {children}
    </BlurView>
  );
}
