import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  AppState,
  type AppStateStatus,
  Linking,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { PressableScale } from "@/components/PressableScale";
import { ThemedText } from "@/components/ThemedText";
import { getEmailConfirmationRedirectTo } from "@/lib/auth-redirect";
import { isSupabaseConfigured } from "@/lib/is-supabase-configured";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/theme/ThemeContext";

const RESEND_COOLDOWN_SECONDS = 30;

type Props = {
  visible: boolean;
  email: string;
  /**
   * User dismissed the sheet without (or before) verifying. They're saying
   * "not now" — parent should route them to a safe place (sign-in).
   */
  onClose: () => void;
  /**
   * User left the app to verify their email and then came back. Treat this
   * as "verification likely happened" and route to the welcome / celebration
   * screen instead of dropping them on sign-in.
   */
  onReturnFromEmail: () => void;
};

/**
 * Bottom sheet shown right after a successful sign-up when email confirmation
 * is required. Tells the user where to find the link, lets them jump into
 * their mail app, and offers a throttled "Resend".
 */
export function VerifyEmailSheet({
  visible,
  email,
  onClose,
  onReturnFromEmail,
}: Props) {
  const theme = useTheme();
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown]   = useState(0);
  /* Set when the user taps "Open email app" — primes the foreground handler
     so we only auto-advance to sign-in when the user has actually left to
     verify, not just briefly switched apps for any other reason. */
  const awaitingReturnRef = useRef(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* Reset cooldown timer when the sheet hides — fresh state next time it opens. */
  useEffect(() => {
    if (!visible) {
      setCooldown(0);
      setResending(false);
      awaitingReturnRef.current = false;
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    }
  }, [visible]);

  /* Auto-advance to the celebration screen after the user comes back from
     their mail app. We give the deep link ~1.5s to land first; if it
     established a session, the route guards will have already routed
     elsewhere. Either way the parent funnels the user through
     /auth/welcome → /(auth)/sign-in for a consistent flow. */
  useEffect(() => {
    if (!visible) return undefined;
    const sub = AppState.addEventListener("change", (next: AppStateStatus) => {
      if (next !== "active" || !awaitingReturnRef.current) return;
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
      closeTimerRef.current = setTimeout(() => {
        awaitingReturnRef.current = false;
        onReturnFromEmail();
      }, 1500);
    });
    return () => {
      sub.remove();
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    };
  }, [visible, onReturnFromEmail]);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const id = setTimeout(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  async function openInbox() {
    /* iOS: Mail.app via mailto:. Android: OS picker via mailto:.
       If no client is available, surface a soft error rather than crashing. */
    const url = "mailto:";
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        Alert.alert("No mail app", "Open your email manually and tap the verification link.");
        return;
      }
      /* Mark that we've sent the user out to verify; the foreground handler
         will close the modal on their return so they're never stuck staring
         at the sheet after the email link did its work elsewhere. */
      awaitingReturnRef.current = true;
      await Linking.openURL(url);
    } catch {
      awaitingReturnRef.current = false;
      Alert.alert("No mail app", "Open your email manually and tap the verification link.");
    }
  }

  async function handleResend() {
    if (cooldown > 0 || resending) return;
    if (!isSupabaseConfigured()) {
      Alert.alert("Not configured", "Supabase keys are missing — can't resend the email right now.");
      return;
    }
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email.trim().toLowerCase(),
        options: { emailRedirectTo: getEmailConfirmationRedirectTo() },
      });
      if (error) {
        Alert.alert("Could not resend", error.message);
        return;
      }
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } finally {
      setResending(false);
    }
  }

  const dotBg = theme.scheme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.04)";
  const resendDisabled = cooldown > 0 || resending;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.colors.surface,
              borderTopLeftRadius: theme.radius.lg,
              borderTopRightRadius: theme.radius.lg,
            },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: theme.colors.border }]} />

          <View style={styles.iconWrap}>
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconCircle}
            >
              <Ionicons name="mail-outline" size={32} color="#FFFFFF" />
            </LinearGradient>
          </View>

          <View style={styles.copyWrap}>
            <ThemedText variant="title" style={{ textAlign: "center" }}>
              Verify your email
            </ThemedText>
            <ThemedText
              variant="body"
              color="muted"
              style={{ textAlign: "center" }}
            >
              We sent a verification link to{" "}
              <ThemedText
                variant="body"
                style={{ fontWeight: "700", color: theme.colors.textPrimary }}
              >
                {email}
              </ThemedText>
              . Tap it to activate your account.
            </ThemedText>
          </View>

          {/* Quick "how to" hints */}
          <View style={[styles.hintCard, { backgroundColor: dotBg }]}>
            <HintRow
              icon="mail-unread-outline"
              text="Open your inbox on this device"
              tintColor={theme.colors.textPrimary}
              subColor={theme.colors.textSecondary}
            />
            <HintRow
              icon="finger-print-outline"
              text={
                Platform.OS === "ios"
                  ? "Tap the link — Mail will pass you back here"
                  : "Tap the link — it opens this app automatically"
              }
              tintColor={theme.colors.textPrimary}
              subColor={theme.colors.textSecondary}
            />
            <HintRow
              icon="alert-circle-outline"
              text="Can't find it? Check spam or promotions"
              tintColor={theme.colors.textPrimary}
              subColor={theme.colors.textSecondary}
            />
          </View>

          <PressableScale
            accessibilityLabel="Open email app"
            onPress={openInbox}
            style={styles.ctaShadow}
          >
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.ctaBtn}
            >
              <ThemedText variant="label" color="onPrimary">Open email app</ThemedText>
              <Ionicons name="arrow-forward" size={18} color={theme.colors.textOnPrimary} />
            </LinearGradient>
          </PressableScale>

          <View style={styles.row}>
            <PressableScale
              accessibilityLabel="Resend verification email"
              accessibilityState={{ disabled: resendDisabled }}
              onPress={handleResend}
              style={[styles.linkBtn, { opacity: resendDisabled ? 0.5 : 1 }]}
            >
              {resending ? (
                <ActivityIndicator size="small" color={theme.colors.textSecondary} />
              ) : (
                <ThemedText variant="caption" color="secondary" style={{ fontWeight: "600" }}>
                  {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend email"}
                </ThemedText>
              )}
            </PressableScale>

            <View style={[styles.dot, { backgroundColor: theme.colors.border }]} />

            <PressableScale
              accessibilityLabel="I'll do it later"
              onPress={onClose}
              style={styles.linkBtn}
            >
              <ThemedText variant="caption" color="muted">
                I'll do it later
              </ThemedText>
            </PressableScale>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function HintRow({
  icon,
  text,
  tintColor,
  subColor,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
  tintColor: string;
  subColor: string;
}) {
  return (
    <View style={styles.hintRow}>
      <Ionicons name={icon} size={16} color={subColor} />
      <ThemedText variant="caption" style={{ color: tintColor, flex: 1 }}>
        {text}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheet: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 36,
    gap: 18,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 4,
  },
  iconWrap: { alignItems: "center" },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#7C3AED",
    shadowOpacity: 0.3,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  copyWrap: { gap: 8, paddingHorizontal: 4 },
  hintCard: {
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  hintRow: { flexDirection: "row", alignItems: "center", gap: 10 },
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
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
  },
  linkBtn: { paddingHorizontal: 4, paddingVertical: 4 },
  dot: { width: 3, height: 3, borderRadius: 2 },
});
