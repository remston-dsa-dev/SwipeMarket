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

type Props = {
  onAddProduct: () => void;
  onDownloadTemplateCsv: () => void;
  onDownloadTemplateXlsx: () => void;
  onImportInventoryFile: () => void;
  onReviewTemplate: () => void;
};

const COPY = {
  emoji: "📦",
  title: "Your shelf is ready",
  subtitle:
    "Publish your first listing or import a .csv or .xlsx—when you go live, shoppers see it in Discover right away.",
} as const;

/**
 * Empty inventory on the partner dashboard — same visual language as
 * `DiscoverEmptyState` (hero ring, sparkles, gradient primary CTA, outline secondaries).
 */
export function SupplierInventoryEmptyState({
  onAddProduct,
  onDownloadTemplateCsv,
  onDownloadTemplateXlsx,
  onImportInventoryFile,
  onReviewTemplate,
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

  return (
    <ScrollView
      style={{ flex: 1 }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scroll}
      keyboardShouldPersistTaps="handled"
    >
      <Animated.View entering={FadeIn.duration(500).delay(80)} style={styles.heroWrap}>
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
              {COPY.emoji}
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
          {COPY.title}
        </ThemedText>
        <ThemedText variant="body" color="muted" style={styles.subtitle}>
          {COPY.subtitle}
        </ThemedText>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(450).delay(200)} style={styles.actions}>
        <PressableScale
          accessibilityLabel="Add your first listing"
          scaleOnPress={false}
          onPress={onAddProduct}
          style={styles.ctaShadow}
        >
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.ctaPrimary, styles.ctaWide]}
          >
            <Text style={styles.ctaEmoji}>✨</Text>
            <ThemedText variant="label" color="onPrimary">
              Add your first listing
            </ThemedText>
          </LinearGradient>
        </PressableScale>

        <View style={styles.templateRow}>
          <PressableScale
            accessibilityLabel="Download product listing template as csv"
            scaleOnPress={false}
            onPress={onDownloadTemplateCsv}
            style={[
              styles.ctaOutline,
              styles.templateHalf,
              {
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.surface,
              },
            ]}
          >
            <ThemedText variant="label" color="primary" numberOfLines={1}>
              .csv
            </ThemedText>
          </PressableScale>
          <PressableScale
            accessibilityLabel="Download product listing template as xlsx"
            scaleOnPress={false}
            onPress={onDownloadTemplateXlsx}
            style={[
              styles.ctaOutline,
              styles.templateHalf,
              {
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.surface,
              },
            ]}
          >
            <ThemedText variant="label" color="primary" numberOfLines={1}>
              .xlsx
            </ThemedText>
          </PressableScale>
        </View>

        <PressableScale
          accessibilityLabel="Add your inventory from csv or xlsx spreadsheet"
          scaleOnPress={false}
          onPress={onImportInventoryFile}
          style={[
            styles.ctaOutline,
            styles.ctaWide,
            {
              borderColor: theme.colors.primary,
              backgroundColor: theme.colors.overlay,
            },
          ]}
        >
          <Text style={styles.ctaEmojiSmall}>📥</Text>
          <ThemedText variant="label" color="secondary">
            Add your Inventory (.csv or .xlsx)
          </ThemedText>
        </PressableScale>

        <PressableScale
          accessibilityLabel="Review product listing template columns and datatypes"
          scaleOnPress={false}
          onPress={onReviewTemplate}
          style={[
            styles.ctaOutline,
            styles.ctaWide,
            {
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.background,
            },
          ]}
        >
          <Text style={styles.ctaEmojiSmall}>📋</Text>
          <ThemedText variant="label" color="primary" numberOfLines={2} style={{ textAlign: "center" }}>
            Review Product Listing Template
          </ThemedText>
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
    paddingVertical: 20,
    gap: 4,
  },
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
  templateRow: {
    flexDirection: "row",
    gap: 10,
    alignSelf: "stretch",
  },
  templateHalf: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 10,
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
