import { Link, useRouter } from "expo-router";
import { View } from "react-native";
import { PressableScale } from "@/components/PressableScale";
import { Screen } from "@/components/Screen";
import { ThemedText } from "@/components/ThemedText";
import {
  useSessionStore,
  type ThemePreference,
} from "@/stores/session-store";
import { useTheme } from "@/theme/ThemeContext";

export default function SignInScreen() {
  const router = useRouter();
  const theme = useTheme();
  const setSession = useSessionStore((s) => s.setSession);
  const setThemePreference = useSessionStore((s) => s.setThemePreference);
  const themePreference = useSessionStore((s) => s.themePreference);

  function continueAs(role: "customer" | "supplier") {
    const id =
      role === "customer" ? "demo-customer" : "demo-supplier";
    setSession(id, role);
    router.replace(role === "supplier" ? "/dashboard" : "/swipe");
  }

  function setPreference(next: ThemePreference) {
    setThemePreference(next);
  }

  return (
    <Screen>
      <View style={{ flex: 1, gap: 20, justifyContent: "center" }}>
        <View style={{ gap: 8 }}>
          <ThemedText variant="title">SwipeMarket</ThemedText>
          <ThemedText variant="body" color="muted">
            Sign in to browse glassy listings or manage your store.
          </ThemedText>
        </View>

        <PressableScale
          accessibilityLabel="Continue as customer"
          onPress={() => continueAs("customer")}
          style={{
            borderRadius: theme.radius.md,
            paddingVertical: 14,
            alignItems: "center",
            backgroundColor: theme.colors.primary,
          }}
        >
          <ThemedText variant="label" color="onPrimary">
            Continue as customer
          </ThemedText>
        </PressableScale>

        <PressableScale
          accessibilityLabel="Continue as supplier"
          onPress={() => continueAs("supplier")}
          style={{
            borderRadius: theme.radius.md,
            paddingVertical: 14,
            alignItems: "center",
            borderWidth: 1,
            borderColor: theme.colors.glassBorder,
            backgroundColor: theme.colors.overlay,
          }}
        >
          <ThemedText variant="label">Continue as supplier</ThemedText>
        </PressableScale>

        <Link href="/sign-up" asChild>
          <PressableScale
            accessibilityLabel="Go to sign up"
            style={{
              alignItems: "center",
              paddingVertical: 10,
            }}
          >
            <ThemedText variant="caption" color="secondary">
              Create an account
            </ThemedText>
          </PressableScale>
        </Link>

        <View style={{ gap: 10 }}>
          <ThemedText variant="caption" color="muted">
            Theme preview
          </ThemedText>
          <View style={{ flexDirection: "row", gap: 10 }}>
            {(["light", "dark", "system"] as const).map((key) => (
              <PressableScale
                key={key}
                accessibilityLabel={`Use ${key} theme`}
                onPress={() => setPreference(key)}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: theme.radius.sm,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor:
                    themePreference === key
                      ? theme.colors.primary
                      : theme.colors.border,
                  backgroundColor: theme.colors.surface,
                }}
              >
                <ThemedText variant="caption">{key}</ThemedText>
              </PressableScale>
            ))}
          </View>
        </View>
      </View>
    </Screen>
  );
}
