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
import { emptyStateCtaEmoji, type HubMenuIconName } from "@/components/menu/HubMenuIcon";
import { MenuIconTile } from "@/components/menu/MenuIconTile";
import { PressableScale } from "@/components/PressableScale";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/theme/ThemeContext";

type Props = {
  onBrowseDiscover: () => void;
};

const COPY = {
  heroIcon: "favorites" as HubMenuIconName,
  ctaIcon: "discover" as const,
  title: "No favorites yet",
  subtitle:
    "Save listings you love from Discover and find them here — quick to compare, share, and buy later.",
  primaryLabel: "Browse Discover",
  steps: [
    "Swipe right on a listing you want to keep",
    "Your saved items land here for easy access",
    "Jump back to Discover anytime to add more",
  ],
} as const;

/**
 * Empty favorites list — matches orders / returns empty states (3D hero, steps, gradient CTA).
 */
export function FavoritesEmptyState({ onBrowseDiscover }: Props) {
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

  return (
    <ScrollView
      style={{ flex: 1 }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scroll}
      keyboardShouldPersistTaps="handled"
    >
      <Animated.View entering={FadeIn.duration(500).delay(80)} style={styles.heroWrap}>
        <Animated.View style={heroFloatStyle}>
          <MenuIconTile name={COPY.heroIcon} size="hero" />
        </Animated.View>

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
          {COPY.title}
        </ThemedText>
        <ThemedText variant="body" color="muted" style={styles.subtitle}>
          {COPY.subtitle}
        </ThemedText>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(450).delay(180)} style={styles.stepsBlock}>
        {COPY.steps.map((step, index) => (
          <View
            key={step}
            style={[
              styles.stepRow,
              {
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.surface,
              },
            ]}
          >
            <View
              style={[
                styles.stepBadge,
                { backgroundColor: theme.colors.overlay, borderColor: theme.colors.border },
              ]}
            >
              <ThemedText variant="caption" color="primary" style={{ fontWeight: "700" }}>
                {index + 1}
              </ThemedText>
            </View>
            <ThemedText variant="caption" color="secondary" style={styles.stepText}>
              {step}
            </ThemedText>
          </View>
        ))}
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(450).delay(260)} style={styles.actions}>
        <PressableScale
          accessibilityLabel={COPY.primaryLabel}
          scaleOnPress={false}
          onPress={onBrowseDiscover}
          style={styles.ctaShadow}
        >
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.ctaPrimary, styles.ctaWide]}
          >
            <Text style={styles.ctaEmoji}>{emptyStateCtaEmoji(COPY.ctaIcon)}</Text>
            <ThemedText variant="label" color="onPrimary">
              {COPY.primaryLabel}
            </ThemedText>
          </LinearGradient>
        </PressableScale>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    gap: 4,
  },
  heroWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    marginBottom: 8,
    height: 108,
    width: "100%",
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
  stepsBlock: {
    width: "100%",
    maxWidth: 400,
    gap: 8,
    marginTop: 16,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  stepBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  stepText: {
    flex: 1,
    lineHeight: 18,
  },
  actions: {
    width: "100%",
    maxWidth: 400,
    gap: 12,
    marginTop: 20,
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
  ctaWide: { alignSelf: "stretch" },
  ctaEmoji: { fontSize: 18 },
});
