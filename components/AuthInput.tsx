import { useState } from "react";
import {
  Pressable,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/theme/ThemeContext";

type Props = TextInputProps & {
  icon: keyof typeof Ionicons.glyphMap;
  isPassword?: boolean;
  error?: string;
};

export function AuthInput({
  icon,
  isPassword = false,
  error,
  style,
  ...rest
}: Props) {
  const theme = useTheme();
  const [showPass, setShowPass] = useState(false);

  const bg = theme.scheme === "dark" ? theme.colors.surface : "#F5F5F5";
  const borderColor = error ? "#EF4444" : "transparent";

  return (
    <View style={{ gap: 6 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: bg,
          borderRadius: theme.radius.md,
          borderWidth: 1.5,
          borderColor,
          paddingHorizontal: 16,
          gap: 12,
        }}
      >
        <Ionicons name={icon} size={18} color={theme.colors.textSecondary} />

        <TextInput
          {...rest}
          secureTextEntry={isPassword && !showPass}
          style={[
            {
              flex: 1,
              paddingVertical: 16,
              fontSize: 16,
              color: theme.colors.textPrimary,
            },
            style,
          ]}
          placeholderTextColor={theme.colors.textSecondary}
        />

        {isPassword && (
          <Pressable
            onPress={() => setShowPass((v) => !v)}
            hitSlop={12}
            accessibilityLabel={showPass ? "Hide password" : "Show password"}
          >
            <Ionicons
              name={showPass ? "eye-off-outline" : "eye-outline"}
              size={18}
              color={theme.colors.textSecondary}
            />
          </Pressable>
        )}
      </View>

      {error ? (
        <ThemedText variant="caption" style={{ color: "#EF4444" }}>
          {error}
        </ThemedText>
      ) : null}
    </View>
  );
}
