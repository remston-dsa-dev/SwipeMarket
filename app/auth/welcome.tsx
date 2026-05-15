import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { Confetti } from "@/components/Confetti";
import { Logo } from "@/components/Logo";
import { PressableScale } from "@/components/PressableScale";
import { ThemedText } from "@/components/ThemedText";
import {
  clearPendingVerification,
  getPendingVerification,
  markEmailCelebrated,
  markUserCelebrated,
} from "@/lib/pending-verification";
import { STATUS_SUCCESS } from "@/lib/status-colors";
import { useSessionStore } from "@/stores/session-store";
import { useTheme } from "@/theme/ThemeContext";

/**
 * Celebration screen shown right after a successful email confirmation. This
 * screen is the single, deterministic stop between confirming an email and
 * using the app:
 *
 *   confirm email link → /auth/welcome → user taps Continue → sign-in / home
 *
 * Crucially we do NOT sign the user out here. If the deep link auto-signed
 * them in, the Continue button drops them straight on the home stack. If
 * they still need to sign in (the link couldn't establish a session, or the
 * upstream guards bounced them here from `/(auth)/sign-in`), the same button
 * sends them through the sign-in form exactly once. `markEmailCelebrated`
 * ensures the route guards do not bring them back here after that sign-in.
 */
export default function WelcomeScreen() {
  const router = useRouter();
  const theme  = useTheme();
  const userId = useSessionStore((s) => s.userId);

  const badgeScale  = useSharedValue(0.4);
  const badgeOp     = useSharedValue(0);
  const titleY      = useSharedValue(28);
  const titleOp     = useSharedValue(0);
  const subOp       = useSharedValue(0);
  const ctaY        = useSharedValue(40);
  const ctaOp       = useSharedValue(0);

  useEffect(() => {
    /* Tag this account as "already celebrated" by every identifier we have:
       userId if a session is live, email if we only have the pending flag.
       The upstream guards (`useShouldCelebrate`, `(auth)/_layout`) consult
       both, so once welcome has played the user never bounces back here. */
    void (async () => {
      const pending = await getPendingVerification();
      if (pending?.email) await markEmailCelebrated(pending.email);
      await clearPendingVerification();
      if (userId) await markUserCelebrated(userId);
    })();

    badgeOp.value    = withTiming(1, { duration: 350 });
    badgeScale.value = withSequence(
      withSpring(1.08, { damping: 9, stiffness: 110 }),
      withSpring(1, { damping: 12, stiffness: 140 }),
    );
    titleOp.value    = withDelay(220, withTiming(1, { duration: 500 }));
    titleY.value     = withDelay(220, withSpring(0, { damping: 16, stiffness: 130 }));
    subOp.value      = withDelay(450, withTiming(1, { duration: 500 }));
    ctaOp.value      = withDelay(700, withTiming(1, { duration: 500 }));
    ctaY.value       = withDelay(700, withSpring(0, { damping: 16, stiffness: 130 }));
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [userId]);

  const badgeStyle = useAnimatedStyle(() => ({
    opacity: badgeOp.value,
    transform: [{ scale: badgeScale.value }],
  }));
  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOp.value,
    transform: [{ translateY: titleY.value }],
  }));
  const subStyle   = useAnimatedStyle(() => ({ opacity: subOp.value }));
  const ctaStyle   = useAnimatedStyle(() => ({
    opacity: ctaOp.value,
    transform: [{ translateY: ctaY.value }],
  }));

  function handleContinue() {
    /* If a session is live (deep link signed them in) forward to root, which
       redirects to onboarding/dashboard. Otherwise send them to the sign-in
       form. Either way, no detour back to welcome — `markEmailCelebrated`
       above has already neutralised the upstream celebrate guards. */
    if (userId) {
      router.replace("/");
    } else {
      router.replace("/(auth)/sign-in");
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <LinearGradient
        colors={[theme.colors.gradientStart, theme.colors.gradientEnd]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <View style={styles.content}>
          <View style={styles.heroBlock}>
            <Logo size="md" showWordmark lightBackground={theme.scheme === "light"} />

            <Animated.View style={[styles.badgeWrap, badgeStyle]}>
              <View style={[styles.badge, { backgroundColor: STATUS_SUCCESS }]}>
                <Ionicons name="checkmark-sharp" size={42} color="#FFFFFF" />
              </View>
            </Animated.View>

            <Animated.View style={titleStyle}>
              <ThemedText variant="title" style={styles.title}>
                Email verified!
              </ThemedText>
            </Animated.View>

            <Animated.View style={subStyle}>
              <ThemedText
                variant="body"
                color="muted"
                style={styles.sub}
              >
                Your account is ready. Sign in to start swiping through finds
                you'll love.
              </ThemedText>
            </Animated.View>
          </View>

          <Animated.View style={[ctaStyle, styles.ctaWrap]}>
            <PressableScale
              accessibilityLabel={userId ? "Continue" : "Continue to sign in"}
              onPress={handleContinue}
              style={styles.ctaShadow}
            >
              <LinearGradient
                colors={[theme.colors.primary, theme.colors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.ctaBtn}
              >
                <ThemedText variant="label" color="onPrimary">
                  {userId ? "Continue" : "Continue to sign in"}
                </ThemedText>
                <Ionicons
                  name="arrow-forward"
                  size={18}
                  color={theme.colors.textOnPrimary}
                />
              </LinearGradient>
            </PressableScale>
          </Animated.View>
        </View>
      </SafeAreaView>

      {/* Confetti renders as the topmost overlay so pieces rain in front of
          the badge, title, and CTA. Sits outside SafeAreaView so particles
          fall from edge to edge (covering the notch / home indicator). */}
      <Confetti />
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "space-between",
    paddingTop: 32,
    paddingBottom: 24,
  },
  heroBlock: { flex: 1, alignItems: "center", justifyContent: "center", gap: 24 },
  badgeWrap: { alignItems: "center" },
  badge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: STATUS_SUCCESS,
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  title: { textAlign: "center" },
  sub:   { textAlign: "center", paddingHorizontal: 8 },
  ctaWrap: { gap: 8 },
  ctaShadow: {
    borderRadius: 999,
    shadowColor: "#7C3AED",
    shadowOpacity: 0.32,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  ctaBtn: {
    borderRadius: 999,
    paddingVertical: 18,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
});
