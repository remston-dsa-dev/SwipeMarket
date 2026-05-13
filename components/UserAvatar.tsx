import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { useTheme } from "@/theme/ThemeContext";
import { initialsFromDisplayName } from "@/lib/avatar-helpers";

type Props = {
  imageUri: string | null;
  displayName: string;
  size?: number;
  /** When true, tapping runs `onPress` (e.g. menu or picker). */
  editable?: boolean;
  onPress?: () => void;
  loading?: boolean;
  /** Used when `editable` and `onPress` are set (e.g. VoiceOver). */
  accessibilityLabel?: string;
};

export function UserAvatar({
  imageUri,
  displayName,
  size = 44,
  editable = false,
  onPress,
  loading = false,
  accessibilityLabel: pressableAccessibilityLabel,
}: Props) {
  const theme = useTheme();
  const initials = initialsFromDisplayName(displayName || "?");
  const radius = size / 2;

  const inner = (
    <View
      style={[
        styles.wrap,
        {
          width: size,
          height: size,
          borderRadius: radius,
          borderWidth: 2,
          borderColor: theme.colors.glassBorder,
          backgroundColor: theme.colors.surface,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={theme.colors.primary} />
      ) : imageUri ? (
        <Image
          source={{ uri: imageUri }}
          style={{ width: size - 4, height: size - 4, borderRadius: radius - 2 }}
          contentFit="cover"
          accessibilityLabel="Profile photo"
        />
      ) : (
        <Text
          style={{
            fontSize: size * 0.36,
            fontWeight: "700",
            color: theme.colors.primary,
          }}
        >
          {initials}
        </Text>
      )}
    </View>
  );

  if (editable && onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityLabel={pressableAccessibilityLabel ?? "Open profile options"}
        hitSlop={8}
      >
        {inner}
      </Pressable>
    );
  }

  return inner;
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
});
