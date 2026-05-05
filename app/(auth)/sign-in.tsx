import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
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

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logoWrap}>
            <Logo size="md" showWordmark lightBackground={isLight} />
          </View>

          <View style={styles.headingWrap}>
            <ThemedText variant="title">Welcome back</ThemedText>
            <ThemedText variant="body" color="muted">Sign in to continue shopping</ThemedText>
          </View>

          <View style={styles.fields}>
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
            style={[styles.ctaBtn, { backgroundColor: loading ? theme.colors.border : theme.colors.primary }]}
          >
            <ThemedText variant="label" color="onPrimary">
              {loading ? "Signing in…" : "Continue"}
            </ThemedText>
          </PressableScale>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={[styles.line, { backgroundColor: theme.colors.border }]} />
            <ThemedText variant="caption" color="muted">or</ThemedText>
            <View style={[styles.line, { backgroundColor: theme.colors.border }]} />
          </View>

          {/* Social */}
          <View style={styles.social}>
            <PressableScale
              accessibilityLabel="Continue with Google"
              onPress={() => Alert.alert("Coming soon", "Google sign-in is not yet available.")}
              style={[styles.socialBtn, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}
            >
              <Text style={{ fontSize: 17, fontWeight: "700", color: "#4285F4" }}>G</Text>
              <ThemedText variant="label">Continue with Google</ThemedText>
            </PressableScale>

            {Platform.OS === "ios" && (
              <PressableScale
                accessibilityLabel="Continue with Apple"
                onPress={() => Alert.alert("Coming soon", "Apple sign-in is not yet available.")}
                style={[styles.socialBtn, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}
              >
                <Ionicons name="logo-apple" size={18} color={theme.colors.textPrimary} />
                <ThemedText variant="label">Continue with Apple</ThemedText>
              </PressableScale>
            )}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
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
              <ThemedText variant="caption" color="muted" style={{ opacity: 0.5, marginTop: 6 }}>
                Supplier portal →
              </ThemedText>
            </PressableScale>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  backRow:     { paddingHorizontal: 20, paddingTop: 8 },
  backBtn:     { alignSelf: "flex-start", padding: 4 },
  scroll:      { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 24 },
  logoWrap:    { alignItems: "center", marginTop: 20, marginBottom: 36 },
  headingWrap: { gap: 6, marginBottom: 28 },
  fields:      { gap: 14, marginBottom: 28 },
  ctaBtn:      { borderRadius: 999, paddingVertical: 18, alignItems: "center", marginBottom: 28 },
  divider:     { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 24 },
  line:        { flex: 1, height: 1 },
  social:      { gap: 12, marginBottom: 36 },
  socialBtn:   { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, borderRadius: 999, paddingVertical: 16, borderWidth: 1.5 },
  footer:      { alignItems: "center", gap: 4 },
});
