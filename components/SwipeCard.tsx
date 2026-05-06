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
  listing:    Listing;
  translateX: SharedValue<number>;
};

export function SwipeCard({ listing, translateX }: Props) {
  const likeStyle = useAnimatedStyle(() => ({
    opacity:   interpolate(translateX.value, [15, 80],  [0, 1], Extrapolation.CLAMP),
    transform: [{ rotate: "8deg" }, { scale: interpolate(translateX.value, [15, 80], [0.7, 1], Extrapolation.CLAMP) }],
  }));

  const nopeStyle = useAnimatedStyle(() => ({
    opacity:   interpolate(translateX.value, [-80, -15], [1, 0], Extrapolation.CLAMP),
    transform: [{ rotate: "-8deg" }, { scale: interpolate(translateX.value, [-80, -15], [1, 0.7], Extrapolation.CLAMP) }],
  }));

  return (
    <View style={styles.root}>
      <ListingCard listing={listing} />

      {/* LIKE stamp */}
      <Animated.View style={[styles.stamp, styles.likeStamp, likeStyle]} pointerEvents="none">
        <Animated.Text style={styles.likeText}>LIKE</Animated.Text>
      </Animated.View>

      {/* NOPE stamp */}
      <Animated.View style={[styles.stamp, styles.nopeStamp, nopeStyle]} pointerEvents="none">
        <Animated.Text style={styles.nopeText}>NOPE</Animated.Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { width: "100%", height: "100%" },

  stamp: {
    position:        "absolute",
    top:             36,
    paddingHorizontal: 14,
    paddingVertical:   8,
    borderRadius:      8,
    borderWidth:       3.5,
  },
  likeStamp: {
    left:            22,
    borderColor:     "#22C55E",
    backgroundColor: "rgba(0,0,0,0.28)",
    shadowColor:     "#22C55E",
    shadowOpacity:   0.55,
    shadowRadius:    12,
    shadowOffset:    { width: 0, height: 0 },
    elevation:       8,
  },
  nopeStamp: {
    right:           22,
    borderColor:     "#EF4444",
    backgroundColor: "rgba(0,0,0,0.28)",
    shadowColor:     "#EF4444",
    shadowOpacity:   0.55,
    shadowRadius:    12,
    shadowOffset:    { width: 0, height: 0 },
    elevation:       8,
  },
  likeText: {
    color:       "#22C55E",
    fontWeight:  "800",
    fontSize:    22,
    letterSpacing: 3,
  },
  nopeText: {
    color:       "#EF4444",
    fontWeight:  "800",
    fontSize:    22,
    letterSpacing: 3,
  },
});
