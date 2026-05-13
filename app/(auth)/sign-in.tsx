import { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { AuthInput } from "@/components/AuthInput";
import { GoogleLogoMark } from "@/components/GoogleLogoMark";
import { Logo } from "@/components/Logo";
import { PressableScale } from "@/components/PressableScale";
import { ThemedText } from "@/components/ThemedText";
import { HREF_ONBOARDING } from "@/lib/routes";
import { getEmailConfirmationRedirectTo } from "@/lib/auth-redirect";
import { getLastSignInEmail, setLastSignInEmail } from "@/lib/auth-form-storage";
import { formatSignInError } from "@/lib/auth-errors";
import { signInWithGoogle } from "@/lib/google-auth";
import { isSupabaseConfigured } from "@/lib/is-supabase-configured";
import { fetchProfileRoleAndOnboarding } from "@/lib/profile-onboarding";
import { supabase } from "@/lib/supabase";
import { useSessionStore } from "@/stores/session-store";
import { useTheme } from "@/theme/ThemeContext";

export default function SignInScreen() {
  const router = useRouter();
  const theme  = useTheme();
  const setSession = useSessionStore((s) => s.setSession);
  const { height } = useWindowDimensions();

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [errors,   setErrors]   = useState<{ email?: string; password?: string }>({});
  const [loading,       setLoading]       = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    void (async () => {
      const saved = await getLastSignInEmail();
      if (saved) setEmail(saved);
    })();
  }, []);

  function validate() {
    const e: typeof errors = {};
    if (!email.trim())
      e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email.trim()))
      e.email = "Enter a valid email address";
    if (!password)
      e.password = "Password is required";
    else if (password.length < 6)
      e.password = "At least 6 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSignIn() {
    if (!validate()) return;

    if (!isSupabaseConfigured()) {
      Alert.alert(
        "Supabase not configured",
        "Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to your .env file (see .env.example).",
      );
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        Alert.alert("Sign in failed", formatSignInError(error.message));
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        Alert.alert(
          "Confirm your email",
          "Check your inbox and confirm your address before signing in.",
        );
        return;
      }

      const { role, onboardingComplete } = await fetchProfileRoleAndOnboarding(session.user.id);
      const emailToSave =
        session.user.email?.trim().toLowerCase() || email.trim().toLowerCase();
      await setLastSignInEmail(emailToSave);
      setSession(session.user.id, role, onboardingComplete);
      if (!onboardingComplete) {
        router.replace(HREF_ONBOARDING);
        return;
      }
      router.replace(role === "supplier" ? "/(supplier)/dashboard" : "/(customer)/swipe");
    } finally {
      setLoading(false);
    }
  }

  async function handleResendConfirmation() {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/\S+@\S+\.\S+/.test(trimmed)) {
      Alert.alert("Email required", "Enter the email you used to sign up, then tap resend.");
      return;
    }
    if (!isSupabaseConfigured()) return;
    setResendLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: trimmed,
        options: { emailRedirectTo: getEmailConfirmationRedirectTo() },
      });
      if (error) {
        Alert.alert("Could not resend", error.message);
        return;
      }
      Alert.alert("Email sent", "Check your inbox for a new confirmation link.");
    } finally {
      setResendLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    try {
      const result = await signInWithGoogle();
      if (!result.ok) return;
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user?.email) {
        await setLastSignInEmail(session.user.email.trim().toLowerCase());
      }
      const onboardingComplete = useSessionStore.getState().onboardingComplete;
      const role = useSessionStore.getState().role ?? result.role;
      if (!onboardingComplete) {
        router.replace(HREF_ONBOARDING);
        return;
      }
      router.replace(
        role === "supplier" ? "/(supplier)/dashboard" : "/(customer)/swipe",
      );
    } catch {
      /* Alert shown in signInWithGoogle */
    } finally {
      setGoogleLoading(false);
    }
  }

  function handleBackPress() {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace("/");
  }

  const isLight = theme.scheme === "light";
  const compact = height < 780;

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      edges={["top", "bottom"]}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.backRow}>
          <PressableScale
            accessibilityLabel="Back"
            onPress={handleBackPress}
            style={styles.backBtn}
          >
            <Ionicons name="arrow-back" size={22} color={theme.colors.textPrimary} />
          </PressableScale>
        </View>

        <View style={[styles.content, compact && styles.contentCompact]}>
          <View style={[styles.logoWrap, compact && styles.logoWrapCompact]}>
            <Logo size={compact ? "sm" : "md"} showWordmark lightBackground={isLight} />
          </View>

          <View style={[styles.headingWrap, compact && styles.headingWrapCompact]}>
            <ThemedText variant="title">Welcome back</ThemedText>
            <ThemedText variant="body" color="muted">Sign in to continue</ThemedText>
          </View>

          <View style={[styles.fields, compact && styles.fieldsCompact]}>
            <AuthInput
              icon="mail-outline"
              placeholder="Email address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              returnKeyType="next"
              error={errors.email}
            />
            <AuthInput
              icon="lock-closed-outline"
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              isPassword
              returnKeyType="done"
              onSubmitEditing={handleSignIn}
              error={errors.password}
            />
            <PressableScale
              accessibilityLabel="Forgot password"
              onPress={() => router.push("/(auth)/forgot-password")}
              style={{ alignSelf: "flex-end" }}
            >
              <ThemedText variant="caption" color="secondary">Forgot password?</ThemedText>
            </PressableScale>
            <PressableScale
              accessibilityLabel="Resend confirmation email"
              onPress={resendLoading ? undefined : handleResendConfirmation}
              style={{ alignSelf: "flex-end", marginTop: 6, opacity: resendLoading ? 0.55 : 1 }}
            >
              <ThemedText variant="caption" color="muted">
                {resendLoading ? "Sending…" : "Resend confirmation email"}
              </ThemedText>
            </PressableScale>
          </View>

          <PressableScale
            accessibilityLabel="Continue"
            onPress={handleSignIn}
            style={[
              styles.ctaBtn,
              compact && styles.ctaBtnCompact,
              { backgroundColor: loading ? theme.colors.border : theme.colors.primary },
            ]}
          >
            <ThemedText variant="label" color="onPrimary">
              {loading ? "Signing in…" : "Continue"}
            </ThemedText>
          </PressableScale>

          <View style={[styles.oauthDivider, compact && styles.oauthDividerCompact]}>
            <View style={[styles.oauthLine, { backgroundColor: theme.colors.border }]} />
            <ThemedText variant="caption" color="muted">or</ThemedText>
            <View style={[styles.oauthLine, { backgroundColor: theme.colors.border }]} />
          </View>

          <PressableScale
            accessibilityLabel="Sign in with Google"
            onPress={handleGoogleSignIn}
            style={[
              styles.googleBtn,
              compact && styles.googleBtnCompact,
              {
                backgroundColor: isLight ? "#FFFFFF" : theme.colors.surface,
                borderColor: isLight ? "rgba(60, 64, 67, 0.28)" : theme.colors.border,
                opacity: googleLoading || loading ? 0.65 : 1,
              },
            ]}
          >
            <GoogleLogoMark size={22} />
            <ThemedText variant="label" style={{ color: isLight ? "#1F1F1F" : theme.colors.textPrimary }}>
              {googleLoading ? "Connecting…" : "Sign in with Google"}
            </ThemedText>
          </PressableScale>

          <View style={[styles.footer, compact && styles.footerCompact]}>
            <PressableScale
              accessibilityLabel="Create account"
              onPress={() => router.replace("/(auth)/sign-up")}
            >
              <Text style={{ color: theme.colors.textSecondary, fontSize: 15 }}>
                New to SwipeMarket?{" "}
                <Text style={{ color: theme.colors.secondary, fontWeight: "600" }}>Create account</Text>
              </Text>
            </PressableScale>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  backRow:     { paddingHorizontal: 20, paddingTop: 8 },
  backBtn:     { alignSelf: "flex-start", padding: 4 },
  content:     { flex: 1, paddingHorizontal: 24, paddingBottom: 24 },
  contentCompact: { paddingBottom: 16 },
  logoWrap:    { alignItems: "center", marginTop: 20, marginBottom: 36 },
  logoWrapCompact: { marginTop: 8, marginBottom: 20 },
  headingWrap: { gap: 6, marginBottom: 28 },
  headingWrapCompact: { marginBottom: 18 },
  fields:      { gap: 14, marginBottom: 28 },
  fieldsCompact: { gap: 10, marginBottom: 18 },
  ctaBtn:      { borderRadius: 999, paddingVertical: 18, alignItems: "center", marginBottom: 20 },
  ctaBtnCompact: { paddingVertical: 14, marginBottom: 14 },
  oauthDivider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  oauthDividerCompact: { marginBottom: 14 },
  oauthLine: { flex: 1, height: StyleSheet.hairlineWidth },
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 999,
    paddingVertical: 16,
    borderWidth: 1,
    marginBottom: 28,
  },
  googleBtnCompact: { paddingVertical: 14, marginBottom: 18 },
  footer:      { alignItems: "center", gap: 4 },
  footerCompact: { gap: 0 },
});
