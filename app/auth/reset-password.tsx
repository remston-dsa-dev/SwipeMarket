import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import * as Linking from "expo-linking";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthInput } from "@/components/AuthInput";
import { PressableScale } from "@/components/PressableScale";
import { ThemedText } from "@/components/ThemedText";
import { gatherLinkingCandidateUrls } from "@/lib/auth-redirect";
import { fetchProfileRoleAndOnboarding } from "@/lib/profile-onboarding";
import { establishSessionFromCallbackUrl, urlLooksLikeAuthRedirect } from "@/lib/google-auth";
import { HREF_ONBOARDING } from "@/lib/routes";
import { supabase } from "@/lib/supabase";
import { useSessionStore } from "@/stores/session-store";
import { useTheme } from "@/theme/ThemeContext";

export default function AuthResetPasswordScreen() {
  const router = useRouter();
  const theme = useTheme();
  const setSession = useSessionStore((s) => s.setSession);
  const hookUrl = Linking.useLinkingURL();

  const [phase, setPhase] = useState<"linking" | "form" | "no_session">("linking");
  const [linkError, setLinkError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const urls = await gatherLinkingCandidateUrls(hookUrl);
      const withPayload = urls.filter(urlLooksLikeAuthRedirect);
      let tokenError: string | null = null;
      if (withPayload.length) {
        await supabase.auth.signOut();
        for (const u of withPayload) {
          if (cancelled) return;
          try {
            await establishSessionFromCallbackUrl(u);
            tokenError = null;
            break;
          } catch (e) {
            tokenError = (e as Error).message;
          }
        }
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (cancelled) return;
      if (session) {
        setPhase("form");
        return;
      }
      setPhase("no_session");
      if (tokenError) {
        setLinkError(tokenError);
      } else if (withPayload.length) {
        setLinkError(
          "This reset link is invalid or has expired. Request a new one from Sign in.",
        );
      } else {
        setLinkError(
          "Open the password reset link from your email on this device, or request a new link from Sign in.",
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hookUrl]);

  async function handleSavePassword() {
    setFieldError(undefined);
    if (password.length < 8) {
      setFieldError("Use at least 8 characters");
      return;
    }
    if (password !== confirm) {
      setFieldError("Passwords do not match");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        Alert.alert("Could not update password", error.message);
        return;
      }
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        Alert.alert("Done", "Sign in with your new password.", [
          { text: "OK", onPress: () => router.replace("/(auth)/sign-in") },
        ]);
        return;
      }
      const { role, onboardingComplete } = await fetchProfileRoleAndOnboarding(session.user.id);
      setSession(session.user.id, role, onboardingComplete);
      if (!onboardingComplete) {
        router.replace(HREF_ONBOARDING);
        return;
      }
      router.replace(role === "supplier" ? "/(supplier)/dashboard" : "/(customer)/swipe");
    } finally {
      setSubmitting(false);
    }
  }

  if (phase === "linking") {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <ThemedText variant="caption" color="muted" style={{ marginTop: 16 }}>
          Opening reset link…
        </ThemedText>
      </View>
    );
  }

  if (phase === "no_session") {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={["top", "bottom"]}>
        <View style={[styles.center, { flex: 1, paddingHorizontal: 28 }]}>
          <ThemedText variant="headline" style={{ textAlign: "center" }}>
            Reset link
          </ThemedText>
          <ThemedText variant="body" color="muted" style={{ textAlign: "center", marginTop: 12 }}>
            {linkError}
          </ThemedText>
          <PressableScale
            accessibilityLabel="Back to sign in"
            onPress={() => router.replace("/(auth)/sign-in")}
            style={[styles.cta, { marginTop: 28, backgroundColor: theme.colors.primary }]}
          >
            <ThemedText variant="label" color="onPrimary">
              Back to sign in
            </ThemedText>
          </PressableScale>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.content}>
          <ThemedText variant="title">Choose a new password</ThemedText>
          <ThemedText variant="body" color="muted" style={{ marginTop: 8, marginBottom: 24 }}>
            Enter a new password for your account.
          </ThemedText>

          <AuthInput
            icon="lock-closed-outline"
            placeholder="New password"
            value={password}
            onChangeText={setPassword}
            isPassword
            returnKeyType="next"
            error={fieldError}
          />
          <AuthInput
            icon="lock-closed-outline"
            placeholder="Confirm new password"
            value={confirm}
            onChangeText={setConfirm}
            isPassword
            returnKeyType="done"
            onSubmitEditing={handleSavePassword}
          />

          <PressableScale
            accessibilityLabel="Save password"
            onPress={handleSavePassword}
            style={[
              styles.cta,
              { backgroundColor: submitting ? theme.colors.border : theme.colors.primary },
            ]}
          >
            <ThemedText variant="label" color="onPrimary">
              {submitting ? "Saving…" : "Save password"}
            </ThemedText>
          </PressableScale>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 24 },
  cta: { borderRadius: 999, paddingVertical: 18, alignItems: "center", width: "100%" },
});
