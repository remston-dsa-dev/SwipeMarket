import { useEffect, useMemo, useState } from "react";
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
import { PressableScale } from "@/components/PressableScale";
import { ThemedText } from "@/components/ThemedText";
import { getLastSignInEmail, setLastSignInEmail } from "@/lib/auth-form-storage";
import { formatSignInError } from "@/lib/auth-errors";
import { signInWithGoogle } from "@/lib/google-auth";
import { isSupabaseConfigured } from "@/lib/is-supabase-configured";
import { fetchProfileRoleAndOnboarding } from "@/lib/profile-onboarding";
import { supabase } from "@/lib/supabase";
import { emailScore, validateEmail } from "@/lib/validation";
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
  const [emailFocused,  setEmailFocused]  = useState(false);
  const [loading,       setLoading]       = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    void (async () => {
      const saved = await getLastSignInEmail();
      if (saved) setEmail(saved);
    })();
  }, []);

  const emailValid    = useMemo(() => validateEmail(email) === null, [email]);
  const emailProgress = useMemo(() => emailScore(email), [email]);
  const formValid     = emailValid && password.length > 0;

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
      email:    validateEmail(email)   ?? undefined,
      password: !password ? "Password is required" : undefined,
    };
    setErrors(e);
    return !e.email && !e.password;
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
      /* Navigation: (auth)/_layout Redirect sends users to onboarding or main — avoid double replace. */
    } finally {
      setLoading(false);
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

  const isLight     = theme.scheme === "light";
  const compact     = height < 780;
  const ctaDisabled = loading || !formValid;
  /* Show the green check only after the user leaves the email field. */
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
            <ThemedText variant="title">Welcome back</ThemedText>
            <ThemedText variant="caption" color="muted">
              Sign in to continue swiping.
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
              icon="lock-closed-outline"
              placeholder="Your password"
              value={password}
              onChangeText={handlePasswordChange}
              isPassword
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="password"
              textContentType="password"
              returnKeyType="done"
              onSubmitEditing={handleSignIn}
              error={errors.password}
            />

            <PressableScale
              accessibilityLabel="Forgot password"
              onPress={() => router.push("/(auth)/forgot-password")}
              style={styles.forgotBtn}
            >
              <ThemedText variant="caption" color="secondary" style={{ fontWeight: "600" }}>
                Forgot password?
              </ThemedText>
            </PressableScale>
          </View>

          <PressableScale
            accessibilityLabel="Sign in"
            accessibilityState={{ disabled: ctaDisabled }}
            onPress={loading ? undefined : handleSignIn}
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
                    Sign In
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

          <View style={[styles.oauthDivider, compact && styles.oauthDividerCompact]}>
            <View style={[styles.oauthLine, { backgroundColor: theme.colors.border }]} />
            <ThemedText variant="caption" color="muted">or continue with</ThemedText>
            <View style={[styles.oauthLine, { backgroundColor: theme.colors.border }]} />
          </View>

          <PressableScale
            accessibilityLabel="Sign in with Google"
            onPress={googleLoading || loading ? undefined : handleGoogleSignIn}
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
                <Text style={{ color: theme.colors.secondary, fontWeight: "700" }}>Create account</Text>
              </Text>
            </PressableScale>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  forgotBtn: { alignSelf: "flex-end", paddingHorizontal: 4, marginTop: 2 },
  ctaShadow: {
    borderRadius: 999,
    marginBottom: 18,
    shadowColor: "#7C3AED",
    shadowOpacity: 0.32,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  ctaShadowCompact: { marginBottom: 14 },
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
