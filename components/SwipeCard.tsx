import { StyleSheet, View } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";
import type { SharedValue } from "react-native-reanimated";
import { ListingCard } from "@/components/ListingCard";
import type { Listing } from "@/types/listing";

type Props = {
  listing: Listing;
  translateX: SharedValue<number>;
};

export function SwipeCard({ listing, translateX }: Props) {
  const likeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [20, 100],
      [0, 1],
      Extrapolation.CLAMP,
    ),
  }));

  const nopeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [-100, -20],
      [1, 0],
      Extrapolation.CLAMP,
    ),
  }));

  return (
    <View style={{ width: "100%" }}>
      <ListingCard listing={listing} />

      <Animated.View
        style={[styles.badge, styles.likeBadge, likeStyle]}
        pointerEvents="none"
      >
        <Animated.Text style={styles.likeText}>LIKE</Animated.Text>
      </Animated.View>

      <Animated.View
        style={[styles.badge, styles.nopeBadge, nopeStyle]}
        pointerEvents="none"
      >
        <Animated.Text style={styles.nopeText}>NOPE</Animated.Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: "absolute",
    top: 28,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 3,
  },
  likeBadge: {
    right: 20,
    borderColor: "#22C55E",
    backgroundColor: "rgba(0,0,0,0.35)",
    transform: [{ rotate: "10deg" }],
  },
  nopeBadge: {
    left: 20,
    borderColor: "#EF4444",
    backgroundColor: "rgba(0,0,0,0.35)",
    transform: [{ rotate: "-10deg" }],
  },
  likeText: {
    color: "#22C55E",
    fontWeight: "800",
    fontSize: 18,
    letterSpacing: 2,
  },
  nopeText: {
    color: "#EF4444",
    fontWeight: "800",
    fontSize: 18,
    letterSpacing: 2,
  },
});
