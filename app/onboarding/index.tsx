import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  unstable_batchedUpdates,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Logo } from "@/components/Logo";
import { PressableScale } from "@/components/PressableScale";
import { Screen } from "@/components/Screen";
import { ThemedText } from "@/components/ThemedText";
import { UserAvatar } from "@/components/UserAvatar";
import {
  displayNameFromUserMetadata,
  googlePictureFromMetadata,
} from "@/lib/avatar-helpers";
import { fetchProfileRoleAndOnboarding } from "@/lib/profile-onboarding";
import { signOutApp } from "@/lib/sign-out";
import { supabase } from "@/lib/supabase";
import { STATUS_SUCCESS } from "@/lib/status-colors";
import { uploadAvatarToStorage } from "@/lib/upload-avatar";
import { useSessionStore, type UserRole } from "@/stores/session-store";
import { useTheme } from "@/theme/ThemeContext";

type Choice = UserRole;

export default function OnboardingScreen() {
  const router = useRouter();
  const theme = useTheme();
  const userId = useSessionStore((s) => s.userId);
  const setSession = useSessionStore((s) => s.setSession);

  const [profileHydrated, setProfileHydrated] = useState(false);
  const [remotePhotoUri, setRemotePhotoUri] = useState<string | null>(null);
  const [emailHint, setEmailHint] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [pickedImageUri, setPickedImageUri] = useState<string | null>(null);
  const [choice, setChoice] = useState<Choice | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadBusy, setUploadBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setProfileHydrated(false);
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled) return;
      if (!user) {
        unstable_batchedUpdates(() => {
          setProfileHydrated(true);
        });
        return;
      }

      const meta = user.user_metadata as Record<string, unknown>;
      const email = user.email?.split("@")[0] ?? "";

      const display = displayNameFromUserMetadata(meta);
      const given = typeof meta.given_name === "string" ? meta.given_name : "";
      const family = typeof meta.family_name === "string" ? meta.family_name : "";

      let nextFirst = "";
      let nextLast = "";
      if (given || family) {
        nextFirst = given;
        nextLast = family;
      } else if (display) {
        const parts = display.split(/\s+/);
        nextFirst = parts[0] ?? "";
        nextLast = parts.slice(1).join(" ") ?? "";
      }

      let remote = googlePictureFromMetadata(meta);
      if (userId) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("id", userId)
          .maybeSingle();
        if (cancelled) return;
        if (prof?.full_name && !given && !family && !display) {
          const p = prof.full_name.split(/\s+/);
          nextFirst = p[0] ?? "";
          nextLast = p.slice(1).join(" ") ?? "";
        }
        if (!remote && prof?.avatar_url) remote = prof.avatar_url;
      }

      if (cancelled) return;
      unstable_batchedUpdates(() => {
        setEmailHint(email);
        setFirstName(nextFirst);
        setLastName(nextLast);
        setRemotePhotoUri(remote);
        setProfileHydrated(true);
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const avatarLabel = useMemo(() => {
    const n = `${firstName} ${lastName}`.trim();
    if (n) return n;
    if (emailHint) return emailHint;
    return "Member";
  }, [firstName, lastName, emailHint]);

  const avatarImageUri = pickedImageUri ?? remotePhotoUri;

  const formReady =
    Boolean(choice) &&
    firstName.trim().length > 0 &&
    lastName.trim().length > 0;

  const ctaDisabled = !formReady || submitting;

  function confirmSignOut() {
    Alert.alert(
      "Sign out?",
      "You will go back to the welcome screen. Nothing is saved until you tap Continue.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign out",
          style: "destructive",
          onPress: () => {
            void (async () => {
              await signOutApp();
              router.replace("/");
            })();
          },
        },
      ],
    );
  }

  function openAvatarMenu() {
    const hasImage = Boolean(avatarImageUri);
    if (hasImage) {
      confirmSignOut();
      return;
    }
    Alert.alert(
      "Profile",
      "Add a profile photo or sign out if you need a different account.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Add photo", onPress: () => void pickAvatar() },
        { text: "Sign out", style: "destructive", onPress: confirmSignOut },
      ],
    );
  }

  async function pickAvatar() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Photos", "Allow photo access to set your profile picture.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (result.canceled || !result.assets[0]) return;
    setPickedImageUri(result.assets[0].uri);
  }

  async function handleContinue() {
    if (!choice || !userId) {
      Alert.alert("Choose your role", "Pick shopper or partner to continue.");
      return;
    }
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert("Your name", "Enter your first and last name so we can personalize your profile.");
      return;
    }

    setSubmitting(true);
    try {
      const {
        data: { session: existingSession },
      } = await supabase.auth.getSession();
      if (!existingSession) {
        Alert.alert(
          "Session expired",
          "Sign in again to finish setting up your profile.",
          [{ text: "OK", onPress: () => router.replace("/(auth)/sign-in") }],
        );
        return;
      }

      const { data: refreshed, error: refreshErr } = await supabase.auth.refreshSession();
      if (refreshErr) {
        console.warn("[onboarding] refreshSession", refreshErr.message);
      }
      const session = refreshed.session ?? existingSession;
      const authUserId = session.user.id;

      let avatarUrl: string | null = null;
      if (pickedImageUri) {
        setUploadBusy(true);
        try {
          avatarUrl = await uploadAvatarToStorage(authUserId, pickedImageUri);
        } finally {
          setUploadBusy(false);
        }
      } else if (remotePhotoUri) {
        avatarUrl = remotePhotoUri;
      }

      const { data: { user: u } } = await supabase.auth.getUser();
      const meta = (u?.user_metadata ?? {}) as Record<string, unknown>;
      const fullName =
        `${firstName.trim()} ${lastName.trim()}`.trim() || displayNameFromUserMetadata(meta) || null;

      const { data: saved, error: profileError } = await supabase
        .from("profiles")
        .update({
          role: choice,
          onboarding_complete: true,
          full_name: fullName,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", authUserId)
        .select("id, role, onboarding_complete")
        .maybeSingle();

      if (profileError) {
        Alert.alert("Could not save", profileError.message);
        return;
      }
      if (!saved?.id) {
        Alert.alert(
          "Could not save",
          "Your account could not update your profile (often a database access rule). Run the latest migrations on your Supabase project (npm run db:push), then try again.",
        );
        return;
      }

      let verified = await fetchProfileRoleAndOnboarding(authUserId);
      for (let attempt = 0; attempt < 6 && !verified.onboardingComplete; attempt++) {
        await new Promise((r) => setTimeout(r, 220));
        verified = await fetchProfileRoleAndOnboarding(authUserId);
      }
      if (!verified.onboardingComplete) {
        Alert.alert(
          "Could not save",
          "We could not confirm your profile update. Check your connection and try Continue again.",
        );
        return;
      }

      setSession(authUserId, verified.role, true);
      router.replace(
        verified.role === "supplier" ? "/(supplier)/dashboard" : "/(customer)/swipe",
      );

      const { error: metaError } = await supabase.auth.updateUser({
        data: { role: verified.role },
      });
      if (metaError) {
        console.warn("[onboarding] auth metadata update", metaError.message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (!profileHydrated) {
    return (
      <Screen style={{ paddingHorizontal: 0 }}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen style={{ paddingHorizontal: 0 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.welcomeRow}>
            <View style={styles.welcomeMain}>
              <View style={styles.titleWithLogo}>
                <View style={styles.welcomeLogo}>
                  <Logo
                    size="sm"
                    showWordmark={false}
                    lightBackground={theme.scheme === "light"}
                  />
                </View>
                <ThemedText
                  variant="title"
                  style={styles.heroTitle}
                  numberOfLines={2}
                >
                  Welcome to SwipeMarket
                </ThemedText>
              </View>
            </View>

            <View style={styles.avatarWrap}>
              <UserAvatar
                imageUri={avatarImageUri}
                displayName={avatarLabel}
                size={48}
                editable
                accessibilityLabel={
                  avatarImageUri ? "Profile: sign out" : "Profile: add photo or sign out"
                }
                onPress={openAvatarMenu}
                loading={uploadBusy}
              />
              <View
                pointerEvents="none"
                style={[
                  styles.activeDot,
                  {
                    backgroundColor: STATUS_SUCCESS,
                    borderColor: theme.colors.background,
                  },
                ]}
                accessibilityElementsHidden
                importantForAccessibility="no"
              />
            </View>
          </View>

          <View style={styles.welcomeFollow}>
            <ThemedText variant="caption" color="muted" style={styles.heroSubtitle}>
              A quick stop so we can tailor the app to you. You can change this later in settings.
            </ThemedText>
            <View
              style={[
                styles.heroRule,
                { backgroundColor: theme.colors.border },
              ]}
            />
          </View>

          <View style={[styles.nameRow, { paddingHorizontal: 20 }]}>
            <View style={{ flex: 1, gap: 6 }}>
              <ThemedText variant="caption" color="muted">First name</ThemedText>
              <TextInput
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Alex"
                placeholderTextColor={theme.colors.textSecondary}
                autoCapitalize="words"
                style={[
                  styles.input,
                  {
                    borderColor: theme.colors.border,
                    color: theme.colors.textPrimary,
                    borderRadius: theme.radius.md,
                    backgroundColor: theme.colors.surface,
                  },
                ]}
              />
            </View>
            <View style={{ flex: 1, gap: 6 }}>
              <ThemedText variant="caption" color="muted">Last name</ThemedText>
              <TextInput
                value={lastName}
                onChangeText={setLastName}
                placeholder="Rivera"
                placeholderTextColor={theme.colors.textSecondary}
                autoCapitalize="words"
                style={[
                  styles.input,
                  {
                    borderColor: theme.colors.border,
                    color: theme.colors.textPrimary,
                    borderRadius: theme.radius.md,
                    backgroundColor: theme.colors.surface,
                  },
                ]}
              />
            </View>
          </View>

          <View style={{ paddingHorizontal: 20, marginTop: 28, gap: 6 }}>
            <ThemedText variant="label" style={styles.sectionLabel}>
              Shopper or partner?
            </ThemedText>
            <ThemedText variant="caption" color="muted">
              Your choice is saved to your profile and used when you sign in.
            </ThemedText>
          </View>

          <View style={[styles.cards, { paddingHorizontal: 20 }]}>
            <PressableScale
              accessibilityLabel="I am a shopper"
              scaleOnPress={false}
              onPress={() => setChoice("customer")}
              style={[
                  styles.card,
                  {
                    borderColor: choice === "customer" ? theme.colors.primary : theme.colors.border,
                    borderWidth: choice === "customer" ? 2 : 1,
                    backgroundColor:
                      choice === "customer"
                        ? theme.scheme === "light"
                          ? "rgba(124,58,237,0.06)"
                          : "rgba(124,58,237,0.14)"
                        : theme.colors.surface,
                    shadowColor: theme.scheme === "light" ? "#0F172A" : "#000",
                    shadowOpacity: theme.scheme === "light" ? 0.06 : 0.25,
                    shadowRadius: 12,
                    shadowOffset: { width: 0, height: 4 },
                    elevation: choice === "customer" ? 4 : 2,
                  },
                ]}
              >
                <View style={[styles.cardIcon, { backgroundColor: theme.colors.primary }]}>
                  <Ionicons name="bag-handle-outline" size={26} color="white" />
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <ThemedText variant="headline">Shopper</ThemedText>
                  <ThemedText variant="caption" color="muted">
                    Swipe listings, save favorites, and check out when you are ready.
                  </ThemedText>
                </View>
                {choice === "customer" ? (
                  <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
                ) : null}
              </PressableScale>

            <PressableScale
              accessibilityLabel="I am a partner seller"
              scaleOnPress={false}
              onPress={() => setChoice("supplier")}
              style={[
                  styles.card,
                  {
                    borderColor: choice === "supplier" ? theme.colors.secondary : theme.colors.border,
                    borderWidth: choice === "supplier" ? 2 : 1,
                    backgroundColor:
                      choice === "supplier"
                        ? theme.scheme === "light"
                          ? "rgba(236,72,153,0.06)"
                          : "rgba(236,72,153,0.14)"
                        : theme.colors.surface,
                    shadowColor: theme.scheme === "light" ? "#0F172A" : "#000",
                    shadowOpacity: theme.scheme === "light" ? 0.06 : 0.25,
                    shadowRadius: 12,
                    shadowOffset: { width: 0, height: 4 },
                    elevation: choice === "supplier" ? 4 : 2,
                  },
                ]}
              >
                <View style={[styles.cardIcon, { backgroundColor: theme.colors.secondary }]}>
                  <Ionicons name="storefront-outline" size={26} color="white" />
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <ThemedText variant="headline">Partner</ThemedText>
                  <ThemedText variant="caption" color="muted">
                    List products, manage inventory, and grow with shoppers.
                  </ThemedText>
                </View>
                {choice === "supplier" ? (
                  <Ionicons name="checkmark-circle" size={24} color={theme.colors.secondary} />
                ) : null}
              </PressableScale>
          </View>

          <View style={{ paddingHorizontal: 20, paddingTop: 28, paddingBottom: 32 }}>
            <PressableScale
              accessibilityLabel="Continue"
              accessibilityState={{ disabled: ctaDisabled }}
              onPress={handleContinue}
              disabled={ctaDisabled}
              style={styles.ctaShadow}
            >
              {formReady ? (
                <LinearGradient
                  colors={[theme.colors.primary, theme.colors.secondary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    borderRadius: theme.radius.pill,
                    paddingVertical: 18,
                    alignItems: "center",
                    opacity: submitting ? 0.85 : 1,
                  }}
                >
                  <ThemedText variant="label" color="onPrimary">
                    {submitting ? "Saving…" : "Continue"}
                  </ThemedText>
                </LinearGradient>
              ) : (
                <View
                  style={{
                    borderRadius: theme.radius.pill,
                    paddingVertical: 18,
                    alignItems: "center",
                    backgroundColor: theme.colors.border,
                  }}
                >
                  <ThemedText
                    variant="label"
                    style={{ color: theme.colors.textSecondary }}
                  >
                    Continue
                  </ThemedText>
                </View>
              )}
            </PressableScale>
            <ThemedText variant="caption" color="muted" style={{ textAlign: "center", marginTop: 14, lineHeight: 20 }}>
              {avatarImageUri
                ? "Tap your profile picture to sign out. We pre-fill your name when we can; edit it if needed."
                : "Tap your profile picture to add a photo or sign out. We pre-fill your name when we can; edit it if needed."}
            </ThemedText>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 24 },
  welcomeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  welcomeMain: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
  },
  titleWithLogo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minWidth: 0,
  },
  welcomeLogo: {
    flexShrink: 0,
  },
  welcomeFollow: {
    paddingHorizontal: 20,
    gap: 10,
    paddingBottom: 4,
  },
  avatarWrap: {
    position: "relative",
    flexShrink: 0,
  },
  activeDot: {
    position: "absolute",
    right: -1,
    bottom: -1,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2.5,
  },
  heroTitle: {
    letterSpacing: -0.35,
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  heroSubtitle: {
    lineHeight: 22,
  },
  heroRule: {
    height: 1,
    alignSelf: "stretch",
    opacity: 0.85,
  },
  sectionLabel: {
    letterSpacing: 0.15,
  },
  ctaShadow: {
    borderRadius: 999,
    shadowColor: "#7C3AED",
    shadowOpacity: 0.28,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  nameRow: { flexDirection: "row", gap: 12, marginTop: 14 },
  input: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
  },
  cards: { gap: 14, marginTop: 8 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 18,
    borderRadius: 20,
  },
  cardIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
});
