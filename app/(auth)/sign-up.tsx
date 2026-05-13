import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { AuthInput } from "@/components/AuthInput";
import { GoogleLogoMark } from "@/components/GoogleLogoMark";
import { Logo } from "@/components/Logo";
import { PasswordRulesSheet } from "@/components/PasswordRulesSheet";
import { PressableScale } from "@/components/PressableScale";
import { ThemedText } from "@/components/ThemedText";
import { getEmailConfirmationRedirectTo } from "@/lib/auth-redirect";
import { setLastSignInEmail } from "@/lib/auth-form-storage";
import { formatSignUpError, isSignUpEmailAlreadyRegistered } from "@/lib/auth-errors";
import { signInWithGoogle } from "@/lib/google-auth";
import { isSupabaseConfigured } from "@/lib/is-supabase-configured";
import { fetchProfileRoleAndOnboarding } from "@/lib/profile-onboarding";
import { supabase } from "@/lib/supabase";
import {
  emailScore,
  isPasswordStrong,
  passwordScore,
  validateEmail,
  validatePassword,
} from "@/lib/validation";
import { useSessionStore, type UserRole } from "@/stores/session-store";
import { useTheme } from "@/theme/ThemeContext";

/** New accounts start as customer; role can be chosen later in the app. */
const DEFAULT_SIGNUP_ROLE: UserRole = "customer";

export default function SignUpScreen() {
  const router = useRouter();
  const theme  = useTheme();
  const setSession = useSessionStore((s) => s.setSession);
  const { height } = useWindowDimensions();

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const [emailFocused,    setEmailFocused]    = useState(false);
  const [rulesOpen,       setRulesOpen]       = useState(false);
  const [loading,       setLoading]       = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const emailValid    = useMemo(() => validateEmail(email) === null, [email]);
  const passwordValid = useMemo(() => isPasswordStrong(password), [password]);
  const emailProgress    = useMemo(() => emailScore(email), [email]);
  const passwordProgress = useMemo(() => passwordScore(password), [password]);

  const formValid = emailValid && passwordValid;

  function clearFieldError(field: keyof typeof errors) {
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  }

  function handleEmailChange(value: string) {
    setEmail(value);
    clearFieldError("email");
  }

  function handlePasswordChange(value: string) {
    setPassword(value);
    clearFieldError("password");
  }

  function validate() {
    const e: typeof errors = {
      email:    validateEmail(email)       ?? undefined,
      password: validatePassword(password) ?? undefined,
    };
    setErrors(e);
    return !e.email && !e.password;
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
      /* Navigation: (auth)/_layout Redirect → onboarding or main */
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
      /* Session + navigation: signInWithGoogle + (auth)/_layout Redirect */
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
  const ctaDisabled = loading || !formValid;
  /* While the user types, only flag the email field as "valid" once they leave the field. */
  const showEmailValid = emailValid && email.length > 0 && !emailFocused;

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
            style={[
              styles.backBtn,
              {
                backgroundColor:
                  theme.scheme === "dark" ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.04)",
              },
            ]}
          >
            <Ionicons name="chevron-back" size={20} color={theme.colors.textPrimary} />
          </PressableScale>
        </View>

        <ScrollView
          contentContainerStyle={[styles.content, compact && styles.contentCompact]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.logoWrap, compact && styles.logoWrapCompact]}>
            <Logo size={compact ? "sm" : "md"} showWordmark lightBackground={isLight} />
          </View>

          <View style={[styles.headingWrap, compact && styles.headingWrapCompact]}>
            <ThemedText variant="title">Create account</ThemedText>
            <ThemedText variant="caption" color="muted">
              Join as a shopper or partner in seconds.
            </ThemedText>
          </View>

          <View style={[styles.fields, compact && styles.fieldsCompact]}>
            <AuthInput
              label="Email"
              icon="mail-outline"
              placeholder="you@example.com"
              value={email}
              onChangeText={handleEmailChange}
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="next"
              progress={emailProgress}
              valid={showEmailValid}
              error={errors.email}
            />

            <AuthInput
              label="Password"
              labelAction={
                <PressableScale
                  accessibilityLabel="View password requirements"
                  onPress={() => setRulesOpen(true)}
                  style={styles.helpBtn}
                >
                  <Ionicons
                    name="help-circle"
                    size={16}
                    color={theme.colors.textSecondary}
                  />
                </PressableScale>
              }
              icon="lock-closed-outline"
              placeholder="Create a strong password"
              value={password}
              onChangeText={handlePasswordChange}
              isPassword
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="password-new"
              textContentType="newPassword"
              returnKeyType="done"
              onSubmitEditing={handleCreate}
              progress={passwordProgress}
              valid={passwordValid}
              error={errors.password}
            />
          </View>

          <PressableScale
            accessibilityLabel="Create account"
            onPress={ctaDisabled ? undefined : handleCreate}
            style={[styles.ctaShadow, compact && styles.ctaShadowCompact]}
          >
            <LinearGradient
              colors={
                ctaDisabled
                  ? [theme.colors.border, theme.colors.border]
                  : [theme.colors.primary, theme.colors.secondary]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.ctaBtn, compact && styles.ctaBtnCompact]}
            >
              {loading ? (
                <ActivityIndicator color={theme.colors.textOnPrimary} />
              ) : (
                <>
                  <ThemedText variant="label" color="onPrimary">
                    Create Account
                  </ThemedText>
                  <Ionicons
                    name="arrow-forward"
                    size={18}
                    color={theme.colors.textOnPrimary}
                  />
                </>
              )}
            </LinearGradient>
          </PressableScale>

          <ThemedText
            variant="caption"
            color="muted"
            style={styles.terms}
          >
            By creating an account, you agree to our{" "}
            <Text style={{ color: theme.colors.secondary, fontWeight: "600" }}>Terms</Text>
            {" "}and{" "}
            <Text style={{ color: theme.colors.secondary, fontWeight: "600" }}>Privacy Policy</Text>.
          </ThemedText>

          <View style={[styles.oauthDivider, compact && styles.oauthDividerCompact]}>
            <View style={[styles.oauthLine, { backgroundColor: theme.colors.border }]} />
            <ThemedText variant="caption" color="muted">or continue with</ThemedText>
            <View style={[styles.oauthLine, { backgroundColor: theme.colors.border }]} />
          </View>

          <PressableScale
            accessibilityLabel="Sign up with Google"
            onPress={googleLoading || loading ? undefined : handleGoogleSignUp}
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
            <GoogleLogoMark size={20} />
            <ThemedText variant="label" style={{ color: isLight ? "#1F1F1F" : theme.colors.textPrimary }}>
              {googleLoading ? "Connecting…" : "Sign up with Google"}
            </ThemedText>
          </PressableScale>

          <View style={[styles.footer, compact && styles.footerCompact]}>
            <PressableScale
              accessibilityLabel="Sign in"
              onPress={() => router.replace("/(auth)/sign-in")}
            >
              <Text style={{ color: theme.colors.textSecondary, fontSize: 15 }}>
                Already have an account?{" "}
                <Text style={{ color: theme.colors.secondary, fontWeight: "700" }}>Sign in</Text>
              </Text>
            </PressableScale>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <PasswordRulesSheet
        visible={rulesOpen}
        password={password}
        onClose={() => setRulesOpen(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  backRow:        { paddingHorizontal: 20, paddingTop: 8 },
  backBtn:        {
    alignSelf: "flex-start",
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  content:        { paddingHorizontal: 24, paddingBottom: 32 },
  contentCompact: { paddingBottom: 20 },
  logoWrap:       { alignItems: "center", marginTop: 16, marginBottom: 28 },
  logoWrapCompact:{ marginTop: 6, marginBottom: 16 },
  headingWrap:    { gap: 6, marginBottom: 24 },
  headingWrapCompact: { marginBottom: 16 },
  fields:         { gap: 14, marginBottom: 24 },
  fieldsCompact:  { gap: 10, marginBottom: 16 },
  helpBtn:        { padding: 2 },
  ctaShadow: {
    borderRadius: 999,
    marginBottom: 12,
    shadowColor: "#7C3AED",
    shadowOpacity: 0.32,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  ctaShadowCompact: { marginBottom: 10 },
  ctaBtn: {
    borderRadius: 999,
    paddingVertical: 18,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  ctaBtnCompact:  { paddingVertical: 14 },
  terms:          { textAlign: "center", paddingHorizontal: 8, marginBottom: 18 },
  oauthDivider:   { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 18 },
  oauthDividerCompact: { marginBottom: 14 },
  oauthLine:      { flex: 1, height: StyleSheet.hairlineWidth },
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 999,
    paddingVertical: 16,
    borderWidth: 1,
    marginBottom: 22,
  },
  googleBtnCompact: { paddingVertical: 14, marginBottom: 16 },
  footer:         { alignItems: "center", gap: 4 },
  footerCompact:  { gap: 0 },
});
