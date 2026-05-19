import { View } from "react-native";
import { UserAvatar } from "@/components/UserAvatar";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/theme/ThemeContext";

export type PartnerInfo = {
  id: string;
  name: string;
  avatarUrl: string | null;
};

type Props = {
  partner: PartnerInfo;
  compact?: boolean;
};

export function PartnerBadge({ partner, compact }: Props) {
  const theme = useTheme();
  const avatarSize = compact ? 22 : 28;
  const label = partner.name.trim() || "Partner";

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: compact ? 6 : 8,
        paddingVertical: compact ? 5 : 6,
        paddingHorizontal: compact ? 8 : 10,
        borderRadius: theme.radius.pill,
        backgroundColor: "rgba(15,23,42,0.72)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.2)",
        maxWidth: "88%",
      }}
    >
      <UserAvatar imageUri={partner.avatarUrl} displayName={label} size={avatarSize} />
      <ThemedText
        variant="caption"
        color="onPrimary"
        numberOfLines={1}
        style={{ flexShrink: 1, fontWeight: "600" }}
      >
        {label}
      </ThemedText>
    </View>
  );
}
