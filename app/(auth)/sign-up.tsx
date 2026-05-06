import { useState } from "react";
import {
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
import { useSessionStore, type UserRole } from "@/stores/session-store";
import { useTheme } from "@/theme/ThemeContext";

type RoleOption = {
  key:         UserRole;
  icon:        React.ComponentProps<typeof Ionicons>["name"];
  title:       string;
  description: string;
};

const ROLES: RoleOption[] = [
  { key: "customer", icon: "bag-outline",        title: "I'm Shopping", description: "Browse & buy unique products"   },
  { key: "supplier", icon: "storefront-outline", title: "I'm Selling",  description: "List products & manage orders" },
];

export default function SignUpScreen() {
  const router = useRouter();
  const theme  = useTheme();
  const setSession = useSessionStore((s) => s.setSession);
  const { height } = useWindowDimensions();

  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [role,     setRole]     = useState<UserRole>("customer");
  const [errors,   setErrors]   = useState<{ name?: string; email?: string; password?: string }>({});
  const [loading,  setLoading]  = useState(false);

  function validate() {
    const e: typeof errors = {};
    if (!name.trim())  e.name = "Full name is required";
    if (!email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email.trim())) e.email = "Enter a valid email address";
    if (!password)             e.password = "Password is required";
    else if (password.length < 8) e.password = "At least 8 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleCreate() {
    if (!validate()) return;
    setLoading(true);
    await new Promise<void>((r) => setTimeout(r, 800));
    setSession(email.trim().toLowerCase(), role);
    router.replace(role === "supplier" ? "/(supplier)/dashboard" : "/(customer)/swipe");
  }

  const isLight = theme.scheme === "light";
  const compact = height < 820;

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
            <ThemedText variant="title">Create account</ThemedText>
            <ThemedText variant="body" color="muted">
              Join thousands of shoppers and sellers
            </ThemedText>
          </View>

          <View style={[styles.fields, compact && styles.fieldsCompact]}>
            <AuthInput
              icon="person-outline"
              placeholder="Full name"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              autoComplete="name"
              returnKeyType="next"
              error={errors.name}
            />
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
              placeholder="Password (8+ characters)"
              value={password}
              onChangeText={setPassword}
              isPassword
              returnKeyType="done"
              error={errors.password}
            />
          </View>

          {/* Role selection */}
          <View style={[styles.roleSection, compact && styles.roleSectionCompact]}>
            <ThemedText variant="label">How will you use SwipeMarket?</ThemedText>
            <View style={[styles.roleRow, compact && styles.roleRowCompact]}>
              {ROLES.map(({ key, icon, title, description }) => {
                const selected = role === key;
                return (
                  <PressableScale
                    key={key}
                    accessibilityLabel={title}
                    onPress={() => setRole(key)}
                    style={[
                      styles.roleCard,
                      compact && styles.roleCardCompact,
                      {
                        borderColor: selected ? theme.colors.primary : theme.colors.border,
                        backgroundColor: selected
                          ? isLight ? "rgba(124,58,237,0.06)" : "rgba(124,58,237,0.15)"
                          : theme.colors.surface,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.roleIcon,
                        compact && styles.roleIconCompact,
                        { backgroundColor: selected ? theme.colors.primary : theme.colors.border },
                      ]}
                    >
                      <Ionicons
                        name={icon}
                        size={20}
                        color={selected ? "white" : theme.colors.textSecondary}
                      />
                    </View>

                    <View style={{ gap: 3 }}>
                      <ThemedText variant="label">{title}</ThemedText>
                      <ThemedText variant="caption" color="muted">{description}</ThemedText>
                    </View>

                    {selected && (
                      <View style={styles.checkmark}>
                        <Ionicons name="checkmark-circle" size={18} color={theme.colors.primary} />
                      </View>
                    )}
                  </PressableScale>
                );
              })}
            </View>
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
  contentCompact: { paddingBottom: 14 },
  logoWrap:    { alignItems: "center", marginTop: 20, marginBottom: 32 },
  logoWrapCompact: { marginTop: 8, marginBottom: 18 },
  headingWrap: { gap: 6, marginBottom: 28 },
  headingWrapCompact: { marginBottom: 16 },
  fields:      { gap: 14, marginBottom: 28 },
  fieldsCompact: { gap: 10, marginBottom: 16 },
  roleSection: { gap: 14, marginBottom: 28 },
  roleSectionCompact: { gap: 10, marginBottom: 16 },
  roleRow:     { flexDirection: "row", gap: 12 },
  roleRowCompact: { gap: 10 },
  roleCard:    { flex: 1, padding: 16, borderRadius: 20, borderWidth: 2, gap: 12, alignItems: "flex-start" },
  roleCardCompact: { padding: 12, borderRadius: 16, gap: 8 },
  roleIcon:    { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  roleIconCompact: { width: 34, height: 34, borderRadius: 17 },
  checkmark:   { position: "absolute", top: 10, right: 10 },
  ctaBtn:      { borderRadius: 999, paddingVertical: 18, alignItems: "center", marginBottom: 20 },
  ctaBtnCompact: { paddingVertical: 14, marginBottom: 14 },
  footer: { alignItems: "center" },
  footerCompact: { marginBottom: 0 },
});
