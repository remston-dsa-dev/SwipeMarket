import { View } from "react-native";
import { UserAvatar } from "@/components/UserAvatar";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/theme/ThemeContext";

export type OrderPartyInfo = {
  name: string;
  avatarUrl: string | null;
  fallbackLabel: string;
};

type Props = {
  party: OrderPartyInfo;
};

export function OrderPartyBadge({ party }: Props) {
  const theme = useTheme();
  const label = party.name.trim() || party.fallbackLabel;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        alignSelf: "flex-start",
        maxWidth: "100%",
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: theme.radius.pill,
        backgroundColor: theme.colors.overlay,
        borderWidth: 1,
        borderColor: theme.colors.border,
      }}
    >
      <UserAvatar imageUri={party.avatarUrl} displayName={label} size={28} />
      <ThemedText variant="caption" color="primary" numberOfLines={1} style={{ flexShrink: 1, fontWeight: "600" }}>
        {label}
      </ThemedText>
    </View>
  );
}
