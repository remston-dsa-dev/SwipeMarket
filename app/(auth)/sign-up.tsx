import { useState } from "react";
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
import { setLastSignInEmail } from "@/lib/auth-form-storage";
import { formatSignUpError, isSignUpEmailAlreadyRegistered } from "@/lib/auth-errors";
import { signInWithGoogle } from "@/lib/google-auth";
import { isSupabaseConfigured } from "@/lib/is-supabase-configured";
import { fetchProfileRoleAndOnboarding } from "@/lib/profile-onboarding";
import { supabase } from "@/lib/supabase";
import { useSessionStore, type UserRole } from "@/stores/session-store";
import { useTheme } from "@/theme/ThemeContext";

/** New accounts start as customer; role can be chosen later in the app. */
const DEFAULT_SIGNUP_ROLE: UserRole = "customer";

export default function SignUpScreen() {
  const router = useRouter();
  const theme  = useTheme();
  const setSession = useSessionStore((s) => s.setSession);
  const { height } = useWindowDimensions();

  const [email,            setEmail]            = useState("");
  const [password,         setPassword]         = useState("");
  const [confirmPassword,  setConfirmPassword]  = useState("");
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [loading,       setLoading]       = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  function validate() {
    const e: typeof errors = {};
    if (!email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email.trim())) e.email = "Enter a valid email address";
    if (!password) e.password = "Password is required";
    else if (password.length < 8) e.password = "At least 8 characters";
    if (!confirmPassword) e.confirmPassword = "Confirm your password";
    else if (password !== confirmPassword) e.confirmPassword = "Passwords do not match";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleCreate() {
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
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          emailRedirectTo: getEmailConfirmationRedirectTo(),
          data: {
            role: DEFAULT_SIGNUP_ROLE,
          },
        },
      });

      if (error) {
        Alert.alert("Sign up failed", formatSignUpError(error.message));
        return;
      }

      if (data.user && isSignUpEmailAlreadyRegistered(data.user)) {
        Alert.alert(
          "Account already exists",
          "Sign in with your email and password or use Google.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Go to sign in", onPress: () => router.replace("/(auth)/sign-in") },
          ],
        );
        return;
      }

      if (!data.session) {
        await setLastSignInEmail(email.trim().toLowerCase());
        Alert.alert(
          "Confirm your email",
          "We sent a confirmation link to your inbox. Open it on this device to verify your account, then sign in here.\n\nIn Supabase: Authentication → Providers → Email → enable Confirm email.",
        );
        router.replace("/(auth)/sign-in");
        return;
      }

      const user = data.session.user;
      const { role: resolved, onboardingComplete } = await fetchProfileRoleAndOnboarding(user.id);
      setSession(user.id, resolved, onboardingComplete);
      if (user.email) await setLastSignInEmail(user.email);
      if (!onboardingComplete) {
        router.replace(HREF_ONBOARDING);
        return;
      }
      router.replace(resolved === "supplier" ? "/(supplier)/dashboard" : "/(customer)/swipe");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignUp() {
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
            <ThemedText variant="title">Create account</ThemedText>
            <ThemedText variant="caption" color="muted">
              Join as a shopper or partner after you verify your email.
            </ThemedText>
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
              returnKeyType="next"
              error={errors.password}
            />
            <AuthInput
              icon="lock-closed-outline"
              placeholder="Confirm password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              isPassword
              returnKeyType="done"
              onSubmitEditing={handleCreate}
              error={errors.confirmPassword}
            />
          </View>

          <PressableScale
            accessibilityLabel="Create account"
            onPress={handleCreate}
            style={[
              styles.ctaBtn,
              compact && styles.ctaBtnCompact,
              { backgroundColor: loading ? theme.colors.border : theme.colors.primary },
            ]}
          >
            <ThemedText variant="label" color="onPrimary">
              {loading ? "Creating account…" : "Create Account"}
            </ThemedText>
          </PressableScale>

          <View style={[styles.oauthDivider, compact && styles.oauthDividerCompact]}>
            <View style={[styles.oauthLine, { backgroundColor: theme.colors.border }]} />
            <ThemedText variant="caption" color="muted">or</ThemedText>
            <View style={[styles.oauthLine, { backgroundColor: theme.colors.border }]} />
          </View>

          <PressableScale
            accessibilityLabel="Sign up with Google"
            onPress={handleGoogleSignUp}
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
              {googleLoading ? "Connecting…" : "Sign up with Google"}
            </ThemedText>
          </PressableScale>
          <ThemedText variant="caption" color="muted" style={{ textAlign: "center", marginBottom: 20, paddingHorizontal: 8 }}>
            Google verifies your email with Google. You will still choose shopper or partner in onboarding.
          </ThemedText>

          <View style={[styles.footer, compact && styles.footerCompact]}>
            <PressableScale
              accessibilityLabel="Sign in"
              onPress={() => router.replace("/(auth)/sign-in")}
            >
              <Text style={{ color: theme.colors.textSecondary, fontSize: 15 }}>
                Already have an account?{" "}
                <Text style={{ color: theme.colors.secondary, fontWeight: "600" }}>Sign in</Text>
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
    marginBottom: 10,
  },
  googleBtnCompact: { paddingVertical: 14, marginBottom: 18 },
  footer:      { alignItems: "center", gap: 4 },
  footerCompact: { gap: 0 },
});
