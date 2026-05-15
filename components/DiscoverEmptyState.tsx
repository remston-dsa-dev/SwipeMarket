import { useEffect, useState } from "react";
import {
  AccessibilityInfo,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { PressableScale } from "@/components/PressableScale";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/theme/ThemeContext";

export type DiscoverEmptyVariant = "exhausted" | "filtered" | "no-data";

type Props = {
  variant: DiscoverEmptyVariant;
  cartCount: number;
  activeFiltersCount: number;
  onClearFilters: () => void;
  onViewCart: () => void;
  onOpenFilters: () => void;
};

/**
 * Celebratory empty state for Discover when there is nothing left to swipe,
 * filters hide everything, or the catalog is still empty — animations stay
 * subtle and respect Reduce Motion. Sign-out is on the header avatar, not here.
 */
export function DiscoverEmptyState({
  variant,
  cartCount,
  activeFiltersCount,
  onClearFilters,
  onViewCart,
  onOpenFilters,
}: Props) {
  const theme = useTheme();
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let sub: { remove: () => void } | undefined;
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    sub = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion);
    return () => sub?.remove();
  }, []);

  const floatY = useSharedValue(0);
  const sparkle = useSharedValue(0.35);

  useEffect(() => {
    if (reduceMotion) {
      floatY.value = 0;
      sparkle.value = 0.55;
      return;
    }
    floatY.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
        withTiming(6, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
    sparkle.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.35, { duration: 1400, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      true,
    );
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [reduceMotion]);

  const heroFloatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));

  const sparkleLeftStyle = useAnimatedStyle(() => ({
    opacity: sparkle.value,
  }));
  const sparkleRightStyle = useAnimatedStyle(() => ({
    opacity: sparkle.value,
  }));

  const meta = VARIANT_COPY[variant];

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scroll}
      keyboardShouldPersistTaps="handled"
    >
      {cartCount > 0 ? (
        <Animated.View entering={FadeInDown.duration(420).delay(40)} style={{ width: "100%", maxWidth: 400 }}>
          <PressableScale
            accessibilityLabel="View cart"
            scaleOnPress={false}
            onPress={onViewCart}
            style={styles.cartBannerShadow}
          >
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cartBanner}
            >
              <Text style={styles.cartEmoji}>🛒</Text>
              <View style={{ flex: 1, gap: 4 }}>
                <ThemedText variant="label" color="onPrimary">
                  {cartCount} item{cartCount !== 1 ? "s" : ""} saved for you
                </ThemedText>
                <ThemedText variant="caption" style={{ color: "rgba(255,255,255,0.92)", lineHeight: 18 }}>
                  Tap to review your cart — checkout when you are ready.
                </ThemedText>
              </View>
              <ThemedText variant="label" color="onPrimary" style={{ opacity: 0.95 }}>
                →
              </ThemedText>
            </LinearGradient>
          </PressableScale>
        </Animated.View>
      ) : null}

      <Animated.View
        entering={FadeIn.duration(500).delay(80)}
        style={[styles.heroWrap, { marginTop: cartCount > 0 ? 8 : 0 }]}
      >
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroGradientRing}
        >
          <View
            style={[
              styles.heroInner,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            <Animated.Text style={[styles.heroEmoji, heroFloatStyle]}>
              {meta.emoji}
            </Animated.Text>
          </View>
        </LinearGradient>

        <Animated.Text
          style={[styles.sparkle, styles.sparkleLeft, sparkleLeftStyle]}
          accessibilityElementsHidden
        >
          ✨
        </Animated.Text>
        <Animated.Text
          style={[styles.sparkle, styles.sparkleRight, sparkleRightStyle]}
          accessibilityElementsHidden
        >
          ✨
        </Animated.Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(480).delay(120)} style={styles.copyBlock}>
        <ThemedText variant="title" style={[styles.title, { color: theme.colors.textPrimary }]}>
          {meta.title}
        </ThemedText>
        <ThemedText variant="body" color="muted" style={styles.subtitle}>
          {meta.subtitle(cartCount, activeFiltersCount)}
        </ThemedText>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(450).delay(200)} style={styles.actions}>
        {variant === "filtered" ? (
          <>
            {activeFiltersCount > 0 ? (
              <PressableScale
                accessibilityLabel="Clear all filters"
                scaleOnPress={false}
                onPress={onClearFilters}
                style={styles.ctaShadow}
              >
                <LinearGradient
                  colors={[theme.colors.primary, theme.colors.secondary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.ctaPrimary, styles.ctaWide]}
                >
                  <Text style={styles.ctaEmoji}>🧹</Text>
                  <ThemedText variant="label" color="onPrimary">
                    Clear filters
                  </ThemedText>
                </LinearGradient>
              </PressableScale>
            ) : null}
            <PressableScale
              accessibilityLabel="Adjust filters"
              scaleOnPress={false}
              onPress={onOpenFilters}
              style={[
                styles.ctaOutline,
                styles.ctaWide,
                {
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.surface,
                },
              ]}
            >
              <Text style={styles.ctaEmojiSmall}>🎛️</Text>
              <ThemedText variant="label" color="primary">
                Tune feed
              </ThemedText>
            </PressableScale>
          </>
        ) : null}

        {variant === "exhausted" ? (
          <PressableScale
            accessibilityLabel="Adjust discover filters"
            scaleOnPress={false}
            onPress={onOpenFilters}
            style={[
              styles.ctaOutline,
              styles.ctaWide,
              {
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.surface,
              },
            ]}
          >
            <Text style={styles.ctaEmojiSmall}>🎛️</Text>
            <ThemedText variant="label" color="primary">
              {activeFiltersCount > 0 ? "Try different filters" : "Browse filters"}
            </ThemedText>
          </PressableScale>
        ) : null}

      </Animated.View>
    </ScrollView>
  );
}

const VARIANT_COPY: Record<
  DiscoverEmptyVariant,
  {
    emoji: string;
    title: string;
    subtitle: (cartCount: number, activeFilters: number) => string;
  }
> = {
  exhausted: {
    emoji: "🎉",
    title: "You did it!",
    subtitle: (_cart, filters) =>
      filters > 0
        ? "You have seen every listing that matches your filters. Loosen a filter or check back soon for fresh drops. ✨"
        : "You have seen everything here for now. New listings will land soon — thanks for exploring with us.",
  },
  filtered: {
    emoji: "🔍",
    title: "Nothing matches… yet",
    subtitle: (_cart, filters) =>
      filters > 0
        ? `Those filters are a little picky (${filters} active). Clear or tune them to unlock more finds.`
        : "Try widening your filters to see more products from partners.",
  },
  "no-data": {
    emoji: "🛍️",
    title: "Shelves are stocking up",
    subtitle: () =>
      "Partners have not published listings yet. Check back soon — great finds are worth the wait.",
  },
};

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
    gap: 4,
  },
  cartBannerShadow: {
    borderRadius: 18,
    width: "100%",
    maxWidth: 400,
    shadowColor: "#7C3AED",
    shadowOpacity: 0.28,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  cartBanner: {
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cartEmoji: { fontSize: 28 },
  heroWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    marginBottom: 8,
    height: 120,
    width: "100%",
  },
  heroGradientRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    padding: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  heroInner: {
    width: 94,
    height: 94,
    borderRadius: 47,
    alignItems: "center",
    justifyContent: "center",
  },
  heroEmoji: {
    fontSize: 44,
    textAlign: "center",
  },
  sparkle: {
    position: "absolute",
    fontSize: 22,
  },
  sparkleLeft: { left: "18%", top: 18 },
  sparkleRight: { right: "18%", top: 22 },
  copyBlock: {
    width: "100%",
    maxWidth: 400,
    gap: 10,
    alignItems: "center",
    paddingHorizontal: 4,
    marginTop: 4,
  },
  title: {
    textAlign: "center",
    letterSpacing: -0.4,
  },
  subtitle: {
    textAlign: "center",
    lineHeight: 24,
  },
  actions: {
    width: "100%",
    maxWidth: 400,
    gap: 12,
    marginTop: 22,
    alignItems: "stretch",
  },
  ctaShadow: {
    borderRadius: 999,
    shadowColor: "#7C3AED",
    shadowOpacity: 0.26,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  ctaPrimary: {
    borderRadius: 999,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  ctaOutline: {
    borderRadius: 999,
    paddingVertical: 15,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
  },
  ctaWide: { alignSelf: "stretch" },
  ctaEmoji: { fontSize: 18 },
  ctaEmojiSmall: { fontSize: 16 },
});
