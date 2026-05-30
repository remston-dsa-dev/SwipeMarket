import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthInput } from "@/components/AuthInput";
import { PressableScale } from "@/components/PressableScale";
import { ThemedText } from "@/components/ThemedText";
import { gatherLinkingCandidateUrls, getPasswordRecoveryRedirectTo } from "@/lib/auth-redirect";
import { setLastSignInEmail } from "@/lib/auth-form-storage";
import { isSupabaseConfigured } from "@/lib/is-supabase-configured";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/theme/ThemeContext";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  async function handleSendLink() {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/\S+@\S+\.\S+/.test(trimmed)) {
      setError("Enter a valid email address");
      return;
    }
    setError(undefined);

    if (!isSupabaseConfigured()) {
      Alert.alert(
        "Supabase not configured",
        "Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to your .env file.",
      );
      return;
    }

    const redirectTo = getPasswordRecoveryRedirectTo();
    if (__DEV__) {
      console.info("[auth] Add this to Supabase Redirect URLs (password recovery):", redirectTo);
    }

    setLoading(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(trimmed, {
        redirectTo,
      });
      if (resetError) {
        Alert.alert("Could not send email", resetError.message);
        return;
      }
      await setLastSignInEmail(trimmed);
      Alert.alert(
        "Check your email",
        "We sent a link to reset your password. Open it on this device, then choose a new password.",
        [{ text: "OK", onPress: () => router.replace("/(auth)/sign-in") }],
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.content}>
          <ThemedText variant="title">Reset password</ThemedText>
          <ThemedText variant="body" color="muted" style={{ marginTop: 8, marginBottom: 24 }}>
            Enter the email for your account. We will send a secure link to choose a new password.
          </ThemedText>

          <AuthInput
            icon="mail-outline"
            placeholder="Email address"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            returnKeyType="done"
            onSubmitEditing={handleSendLink}
            error={error}
          />

          <PressableScale
            accessibilityLabel="Send reset link"
            onPress={handleSendLink}
            style={[
              styles.cta,
              { backgroundColor: loading ? theme.colors.border : theme.colors.primary },
            ]}
          >
            <ThemedText variant="label" color="onPrimary">
              {loading ? "Sending…" : "Send reset link"}
            </ThemedText>
          </PressableScale>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 16 },
  cta: { marginTop: 24, borderRadius: 999, paddingVertical: 18, alignItems: "center" },
});
