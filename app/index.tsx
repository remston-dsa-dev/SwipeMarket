import { useEffect, useRef } from "react";
import { ActivityIndicator, Dimensions, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Redirect, useRouter } from "expo-router";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Logo } from "@/components/Logo";
import { PressableScale } from "@/components/PressableScale";
import { useShouldCelebrate } from "@/hooks/useShouldCelebrate";
import { HREF_ONBOARDING } from "@/lib/routes";
import { useSessionStore } from "@/stores/session-store";

const { height: H } = Dimensions.get("window");

export default function Index() {
  const userId               = useSessionStore((s) => s.userId);
  const role                 = useSessionStore((s) => s.role);
  const onboardingComplete   = useSessionStore((s) => s.onboardingComplete);
  const authInitialized      = useSessionStore((s) => s.authInitialized);
  const celebrate            = useShouldCelebrate();

  if (!authInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0C0520" }}>
        <ActivityIndicator size="large" color="#A855F7" />
      </View>
    );
  }

  if (userId) {
    /* Wait for the celebration check to resolve before redirecting; otherwise
       we'd flash the onboarding/dashboard screen briefly before bouncing to
       /auth/welcome. */
    if (celebrate === null) {
      return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0C0520" }}>
          <ActivityIndicator size="large" color="#A855F7" />
        </View>
      );
    }
    if (celebrate) return <Redirect href="/auth/welcome" />;
    if (!onboardingComplete) {
      return <Redirect href={HREF_ONBOARDING} />;
    }
    return (
      <Redirect
        href={role === "supplier" ? "/(supplier)/dashboard" : "/(customer)/swipe"}
      />
    );
  }

  return <LandingScreen />;
}

function LandingScreen() {
  const router = useRouter();

  const logoOpacity = useSharedValue(0);
  const logoScale   = useSharedValue(0.75);
  const taglineOp   = useSharedValue(0);
  const taglineY    = useSharedValue(28);
  const featureOp   = useSharedValue(0);
  const ctaOp       = useSharedValue(0);
  const ctaY        = useSharedValue(60);
  const card1Y      = useSharedValue(0);
  const card2Y      = useSharedValue(0);

  const pulseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    logoOpacity.value = withTiming(1, { duration: 750 });
    logoScale.value   = withSpring(1, { damping: 11, stiffness: 85 });
    taglineOp.value   = withDelay(350, withTiming(1, { duration: 600 }));
    taglineY.value    = withDelay(350, withSpring(0, { damping: 18, stiffness: 130 }));
    featureOp.value   = withDelay(750, withTiming(1, { duration: 550 }));
    ctaOp.value       = withDelay(1050, withTiming(1, { duration: 600 }));
    ctaY.value        = withDelay(1050, withSpring(0, { damping: 18, stiffness: 120 }));

    card1Y.value = withRepeat(
      withSequence(withTiming(-14, { duration: 2300 }), withTiming(14, { duration: 2300 })),
      -1, true,
    );
    card2Y.value = withRepeat(
      withSequence(withTiming(10, { duration: 2700 }), withTiming(-10, { duration: 2700 })),
      -1, true,
    );

    pulseTimer.current = setTimeout(() => {
      logoScale.value = withRepeat(
        withSequence(withTiming(1.05, { duration: 1900 }), withTiming(1.0, { duration: 1900 })),
        -1, true,
      );
    }, 1300);

    return () => { if (pulseTimer.current) clearTimeout(pulseTimer.current); };
  }, []);

  const logoStyle    = useAnimatedStyle(() => ({
    opacity: logoOpacity.value, transform: [{ scale: logoScale.value }],
  }));
  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOp.value, transform: [{ translateY: taglineY.value }],
  }));
  const featureStyle = useAnimatedStyle(() => ({ opacity: featureOp.value }));
  const ctaStyle     = useAnimatedStyle(() => ({
    opacity: ctaOp.value, transform: [{ translateY: ctaY.value }],
  }));
  const card1Style   = useAnimatedStyle(() => ({
    transform: [{ translateY: card1Y.value }, { rotate: "13deg" }],
  }));
  const card2Style   = useAnimatedStyle(() => ({
    transform: [{ translateY: card2Y.value }, { rotate: "-9deg" }],
  }));

  const features: { icon: React.ComponentProps<typeof Ionicons>["name"]; label: string }[] = [
    { icon: "swap-horizontal-outline", label: "Swipe" },
    { icon: "heart-outline",           label: "Like"  },
    { icon: "bag-check-outline",       label: "Buy"   },
  ];

  return (
    <LinearGradient colors={["#0C0520", "#1E1035", "#3B1474"]} style={StyleSheet.absoluteFill}>
      {/* Floating decorative cards */}
      <Animated.View
        pointerEvents="none"
        style={[styles.floatCard, { top: H * 0.08, right: -28, opacity: 0.55 }, card1Style]}
      >
        <LinearGradient colors={["#7C3AED", "#9333EA"]} style={styles.floatInner}>
          <View style={styles.floatIconWrap}>
            <Ionicons name="camera-outline" size={40} color="rgba(255,255,255,0.9)" />
          </View>
          <Text style={styles.floatTitle}>Vintage Camera</Text>
          <Text style={styles.floatPrice}>$240</Text>
        </LinearGradient>
      </Animated.View>

      <Animated.View
        pointerEvents="none"
        style={[styles.floatCard, { top: H * 0.44, left: -22, width: 128, height: 168, opacity: 0.45 }, card2Style]}
      >
        <LinearGradient colors={["#A855F7", "#EC4899"]} style={styles.floatInner}>
          <View style={styles.floatIconWrap}>
            <Ionicons name="headset-outline" size={36} color="rgba(255,255,255,0.9)" />
          </View>
          <Text style={styles.floatTitle}>Earbuds Pro</Text>
          <Text style={styles.floatPrice}>$129</Text>
        </LinearGradient>
      </Animated.View>

      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        {/* Hero */}
        <View style={styles.hero}>
          <Animated.View style={[logoStyle, { alignItems: "center" }]}>
            <Logo size="lg" showWordmark />
          </Animated.View>

          <Animated.View style={[taglineStyle, { alignItems: "center", gap: 12 }]}>
            <Text style={styles.headline}>The marketplace{"\n"}you'll love.</Text>
            <Text style={styles.sub}>
              Swipe through unique products.{"\n"}Add to cart. Checkout instantly.
            </Text>
          </Animated.View>

          <Animated.View style={[featureStyle, { flexDirection: "row", gap: 10 }]}>
            {features.map(({ icon, label }) => (
              <View key={label} style={styles.pill}>
                <Ionicons name={icon} size={14} color="rgba(255,255,255,0.85)" />
                <Text style={styles.pillText}>{label}</Text>
              </View>
            ))}
          </Animated.View>
        </View>

        {/* CTA */}
        <Animated.View style={[ctaStyle, styles.cta]}>
          <PressableScale
            accessibilityLabel="Get Started"
            onPress={() => router.push("/(auth)/sign-up")}
            style={styles.btnPrimary}
          >
            <Text style={styles.btnPrimaryText}>Get Started</Text>
          </PressableScale>

          <PressableScale
            accessibilityLabel="Sign In"
            onPress={() => router.push("/(auth)/sign-in")}
            style={styles.btnSecondary}
          >
            <Text style={styles.btnSecondaryText}>Sign In</Text>
          </PressableScale>

          <Text style={styles.legal}>
            By continuing you agree to our Terms &amp; Privacy Policy
          </Text>
        </Animated.View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  floatCard:    { position: "absolute", width: 140, height: 190, borderRadius: 20, overflow: "hidden" },
  floatInner:   { flex: 1, padding: 14 },
  floatIconWrap:{ flex: 1, alignItems: "center", justifyContent: "center" },
  floatTitle:   { color: "white", fontWeight: "700", fontSize: 12 },
  floatPrice:   { color: "rgba(255,255,255,0.65)", fontSize: 12, marginTop: 2 },

  hero: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, gap: 32 },
  headline: { fontSize: 36, fontWeight: "800", color: "white", letterSpacing: -1, textAlign: "center", lineHeight: 42 },
  sub:      { fontSize: 16, color: "rgba(255,255,255,0.6)", textAlign: "center", lineHeight: 24 },

  pill:     { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.1)", borderWidth: 1, borderColor: "rgba(255,255,255,0.15)" },
  pillText: { color: "rgba(255,255,255,0.85)", fontSize: 13, fontWeight: "600" },

  cta:            { paddingHorizontal: 24, paddingBottom: 12, gap: 12 },
  btnPrimary:     { backgroundColor: "white", borderRadius: 999, paddingVertical: 18, alignItems: "center" },
  btnPrimaryText: { color: "#7C3AED", fontWeight: "800", fontSize: 17 },
  btnSecondary:     { borderRadius: 999, paddingVertical: 18, alignItems: "center", borderWidth: 1.5, borderColor: "rgba(255,255,255,0.35)" },
  btnSecondaryText: { color: "white", fontWeight: "700", fontSize: 17 },
  legal: { color: "rgba(255,255,255,0.3)", textAlign: "center", fontSize: 12, marginTop: 4 },
});
