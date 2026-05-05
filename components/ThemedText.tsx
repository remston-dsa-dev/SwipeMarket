import type { ReactNode } from "react";
import { Text, type StyleProp, type TextStyle } from "react-native";
import type { TypographyVariant } from "@/theme/ThemeContext";
import { useTheme } from "@/theme/ThemeContext";

type TextColor = "primary" | "secondary" | "muted" | "onPrimary";

type Props = {
  variant?: TypographyVariant;
  color?: TextColor;
  children: ReactNode;
  style?: StyleProp<TextStyle>;
};

export function ThemedText({
  variant = "body",
  color = "primary",
  children,
  style,
}: Props) {
  const theme = useTheme();
  const colorValue =
    color === "primary"
      ? theme.colors.textPrimary
      : color === "secondary"
        ? theme.colors.secondary
        : color === "onPrimary"
          ? theme.colors.textOnPrimary
          : theme.colors.textSecondary;

  return (
    <Text style={[theme.typography[variant], { color: colorValue }, style]}>
      {children}
    </Text>
  );
}
