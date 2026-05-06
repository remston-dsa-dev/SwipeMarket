import { Image } from "expo-image";
import type { StyleProp, ViewStyle } from "react-native";
import { View } from "react-native";
import { GlassSurface } from "@/components/GlassSurface";
import { ThemedText } from "@/components/ThemedText";
import type { Listing } from "@/types/listing";
import { useTheme } from "@/theme/ThemeContext";

type Props = {
  listing: Listing;
  style?: StyleProp<ViewStyle>;
};

export function ListingCard({ listing, style }: Props) {
  const theme = useTheme();
  return (
    <View style={[{ width: "100%" }, style]}>
      <GlassSurface style={{ flexGrow: 1 }}>
        <Image
          source={{ uri: listing.imageUrl }}
          style={{
            width: "100%",
            height: 360,
            borderTopLeftRadius: theme.radius.md - 1,
            borderTopRightRadius: theme.radius.md - 1,
          }}
          contentFit="cover"
          accessibilityLabel={listing.title}
        />
        <View
          style={{
            padding: 16,
            gap: 6,
            backgroundColor: theme.colors.surface,
          }}
        >
          <ThemedText variant="caption" color="muted">
            {(listing.parentCategory ?? listing.category ?? "General") +
              (listing.subCategory ? ` • ${listing.subCategory}` : "")}
          </ThemedText>
          <ThemedText variant="headline">{listing.title}</ThemedText>
          <ThemedText variant="label" color="secondary">
            {listing.priceLabel}
            {listing.unit ? ` / ${listing.unit}` : ""}
          </ThemedText>
          {(listing.attributes?.length ?? 0) > 0 && (
            <ThemedText variant="caption" color="muted">
              Attributes: {listing.attributes?.join(" • ")}
            </ThemedText>
          )}
          {(listing.variants?.length ?? 0) > 0 && (
            <ThemedText variant="caption" color="muted">
              Variants: {listing.variants?.join(" • ")}
            </ThemedText>
          )}
        </View>
      </GlassSurface>
    </View>
  );
}
