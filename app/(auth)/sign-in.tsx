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
import { Logo } from "@/components/Logo";
import { PressableScale } from "@/components/PressableScale";
import { ThemedText } from "@/components/ThemedText";
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
  const [loading,  setLoading]  = useState(false);

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
    setLoading(true);
    await new Promise<void>((r) => setTimeout(r, 700));
    setSession(email.trim().toLowerCase(), "customer");
    router.replace("/(customer)/swipe");
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
            onPress={() => router.back()}
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
            <ThemedText variant="body" color="muted">Sign in to continue shopping</ThemedText>
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
              onPress={() => Alert.alert("Reset password", "Password reset emails coming soon.")}
              style={{ alignSelf: "flex-end" }}
            >
              <ThemedText variant="caption" color="secondary">Forgot password?</ThemedText>
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

            <PressableScale
              accessibilityLabel="Supplier portal"
              onPress={() => {
                setSession("supplier@demo.com", "supplier");
                router.replace("/(supplier)/dashboard");
              }}
            >
              <ThemedText variant="caption" color="muted" style={{ opacity: 0.5, marginTop: compact ? 4 : 6 }}>
                Supplier portal →
              </ThemedText>
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
  ctaBtn:      { borderRadius: 999, paddingVertical: 18, alignItems: "center", marginBottom: 28 },
  ctaBtnCompact: { paddingVertical: 14, marginBottom: 18 },
  footer:      { alignItems: "center", gap: 4 },
  footerCompact: { gap: 0 },
});
