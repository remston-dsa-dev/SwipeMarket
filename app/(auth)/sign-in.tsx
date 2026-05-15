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
import { Redirect, useRouter } from "expo-router";
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
import {
  getPendingVerification,
  hasEmailBeenCelebrated,
} from "@/lib/pending-verification";
import { fetchProfileRoleAndOnboarding } from "@/lib/profile-onboarding";
import { STATUS_SUCCESS } from "@/lib/status-colors";
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
  /* Email that has just been celebrated on the welcome screen. Used to show
     a friendly "Email verified — sign in to continue" banner once the user
     lands here from the post-confirmation flow. */
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  /* Pre-render gate: while we look up whether the user still has an
     un-celebrated pending verification, render nothing. If the lookup says
     they do, we redirect to /auth/welcome so the celebration always plays
     BEFORE the sign-in form. Otherwise we show the form. The async lookup
     finishes in a few ms, so the user never perceives a flash. */
  const [gate, setGate] = useState<"resolving" | "welcome" | "show">(
    "resolving",
  );

  useEffect(() => {
    void (async () => {
      const [saved, pending] = await Promise.all([
        getLastSignInEmail(),
        getPendingVerification(),
      ]);
      if (saved) setEmail(saved);

      /* Has the welcome screen already played for this email? */
      const candidate = (saved ?? pending?.email ?? "").trim().toLowerCase();
      const celebrated =
        !!candidate && (await hasEmailBeenCelebrated(candidate));

      /* Outstanding pending verification (recent sign-up that hasn't passed
         through welcome yet). We require the flag to be reasonably recent
         (< 30 min) so a stale flag from a much earlier session doesn't keep
         pulling users into welcome whenever they open sign-in. */
      const PENDING_FRESH_MS = 30 * 60 * 1000;
      const pendingFresh =
        !!pending &&
        Number.isFinite(pending.ts) &&
        Date.now() - pending.ts < PENDING_FRESH_MS;

      if (pendingFresh && !celebrated) {
        setGate("welcome");
        return;
      }

      if (celebrated) setPendingEmail(candidate);
      setGate("show");
    })();
  }, []);

  /* Must run before any early return — hooks order must be stable across
     gate transitions (resolving → welcome → show). */
  const emailValid    = useMemo(() => validateEmail(email) === null, [email]);
  const emailProgress = useMemo(() => emailScore(email), [email]);
  const formValid     = emailValid && password.length > 0;

  if (gate === "resolving") return null;
  if (gate === "welcome") return <Redirect href="/auth/welcome" />;

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
  /* Show the "Email verified" banner only while the prefilled email still
     matches the pending verification — once the user edits the field to a
     different address the banner stops applying. */
  const showVerifiedBanner =
    !!pendingEmail &&
    email.trim().toLowerCase() === pendingEmail;

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
            <ThemedText variant="title">
              {showVerifiedBanner ? "Email verified" : "Welcome back"}
            </ThemedText>
            <ThemedText variant="caption" color="muted">
              {showVerifiedBanner
                ? "Sign in once more to finish setting up your account."
                : "Sign in to continue swiping."}
            </ThemedText>
          </View>

          {showVerifiedBanner ? (
            <View
              style={[
                styles.verifiedBanner,
                {
                  backgroundColor:
                    theme.scheme === "dark"
                      ? "rgba(5,150,105,0.16)"
                      : "rgba(5,150,105,0.10)",
                  borderColor:
                    theme.scheme === "dark"
                      ? "rgba(5,150,105,0.45)"
                      : "rgba(5,150,105,0.35)",
                },
              ]}
            >
              <View style={[styles.verifiedBadge, { backgroundColor: STATUS_SUCCESS }]}>
                <Ionicons name="checkmark-sharp" size={12} color="#FFFFFF" />
              </View>
              <ThemedText
                variant="caption"
                style={{ color: theme.colors.textPrimary, flex: 1 }}
              >
                Your email{" "}
                <ThemedText
                  variant="caption"
                  style={{ fontWeight: "700", color: theme.colors.textPrimary }}
                >
                  {pendingEmail}
                </ThemedText>
                {" "}is confirmed. Enter your password to continue.
              </ThemedText>
            </View>
          ) : null}

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
  verifiedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  verifiedBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
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
