import { Link } from "expo-router";
import { View } from "react-native";
import { PressableScale } from "@/components/PressableScale";
import { Screen } from "@/components/Screen";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/theme/ThemeContext";

export default function SignUpScreen() {
  const theme = useTheme();
  return (
    <Screen>
      <View style={{ flex: 1, gap: 16, justifyContent: "center" }}>
        <ThemedText variant="headline">Create an account</ThemedText>
        <ThemedText variant="body" color="muted">
          Full email and password flows will plug into Supabase auth next.
        </ThemedText>
        <Link href="/sign-in" asChild>
          <PressableScale
            accessibilityLabel="Back to sign in"
            style={{
              borderRadius: theme.radius.md,
              paddingVertical: 14,
              alignItems: "center",
              backgroundColor: theme.colors.primary,
            }}
          >
            <ThemedText variant="label" color="onPrimary">
              Back to sign in
            </ThemedText>
          </PressableScale>
        </Link>
      </View>
    </Screen>
  );
}
