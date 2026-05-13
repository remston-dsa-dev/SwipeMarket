import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
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
import { uploadAvatarToStorage } from "@/lib/upload-avatar";
import { useSessionStore, type UserRole } from "@/stores/session-store";
import { useTheme } from "@/theme/ThemeContext";

type Choice = UserRole;

export default function OnboardingScreen() {
  const router = useRouter();
  const theme = useTheme();
  const userId = useSessionStore((s) => s.userId);
  const setSession = useSessionStore((s) => s.setSession);

  const [isGoogle, setIsGoogle] = useState(false);
  const [remotePhotoUri, setRemotePhotoUri] = useState<string | null>(null);
  const [emailHint, setEmailHint] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [pickedImageUri, setPickedImageUri] = useState<string | null>(null);
  const [choice, setChoice] = useState<Choice | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadBusy, setUploadBusy] = useState(false);

  const scaleShop = useSharedValue(1);
  const scaleSell = useSharedValue(1);

  const shopStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleShop.value }],
  }));
  const sellStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleSell.value }],
  }));

  const loadProfile = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const meta = user.user_metadata as Record<string, unknown>;
    const google = user.identities?.some((i) => i.provider === "google") ?? false;
    setIsGoogle(google);
    setEmailHint(user.email?.split("@")[0] ?? "");

    const display = displayNameFromUserMetadata(meta);
    const given = typeof meta.given_name === "string" ? meta.given_name : "";
    const family = typeof meta.family_name === "string" ? meta.family_name : "";
    if (given || family) {
      setFirstName(given);
      setLastName(family);
    } else if (display) {
      const parts = display.split(/\s+/);
      setFirstName(parts[0] ?? "");
      setLastName(parts.slice(1).join(" ") ?? "");
    }

    let remote = googlePictureFromMetadata(meta);
    if (userId) {
      const { data: prof } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", userId)
        .maybeSingle();
      if (prof?.full_name && !given && !family && !display) {
        const p = prof.full_name.split(/\s+/);
        setFirstName(p[0] ?? "");
        setLastName(p.slice(1).join(" ") ?? "");
      }
      if (!remote && prof?.avatar_url) remote = prof.avatar_url;
    }
    setRemotePhotoUri(remote);
  }, [userId]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const avatarLabel = useMemo(() => {
    const n = `${firstName} ${lastName}`.trim();
    if (n) return n;
    if (emailHint) return emailHint;
    return "Member";
  }, [firstName, lastName, emailHint]);

  const avatarImageUri = pickedImageUri ?? remotePhotoUri;

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

  function setChoiceAnimated(next: Choice) {
    setChoice(next);
    scaleShop.value = withSpring(next === "customer" ? 1.03 : 1, { damping: 14, stiffness: 180 });
    scaleSell.value = withSpring(next === "supplier" ? 1.03 : 1, { damping: 14, stiffness: 180 });
  }

  async function pickAvatar() {
    if (isGoogle) return;
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
    if (!isGoogle && (!firstName.trim() || !lastName.trim())) {
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
          <View style={styles.topBar}>
            <View style={{ flex: 1 }} />
            {userId ? (
              <PressableScale
                accessibilityLabel="Sign out"
                onPress={confirmSignOut}
                style={{ paddingVertical: 8, paddingHorizontal: 4, marginRight: 4 }}
              >
                <Ionicons name="log-out-outline" size={26} color={theme.colors.textSecondary} />
              </PressableScale>
            ) : null}
            <UserAvatar
              imageUri={avatarImageUri}
              displayName={avatarLabel}
              size={48}
              editable={!isGoogle}
              onPress={isGoogle ? undefined : pickAvatar}
              loading={uploadBusy}
            />
          </View>

          <View style={{ paddingHorizontal: 20, gap: 8 }}>
            <ThemedText variant="title">Welcome to SwipeMarket</ThemedText>
            <ThemedText variant="body" color="muted">
              A quick stop so we can tailor the app to you. You can change this later in settings.
            </ThemedText>
          </View>

          {!isGoogle ? (
            <View style={[styles.nameRow, { paddingHorizontal: 20 }]}>
              <View style={{ flex: 1, gap: 6 }}>
                <ThemedText variant="caption" color="muted">First name</ThemedText>
                <TextInput
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="Alex"
                  placeholderTextColor={theme.colors.textSecondary}
                  autoCapitalize="words"
                  style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.textPrimary }]}
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
                  style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.textPrimary }]}
                />
              </View>
            </View>
          ) : null}

          <View style={{ paddingHorizontal: 20, marginTop: 28, gap: 10 }}>
            <ThemedText variant="label">Shopper or partner?</ThemedText>
            <ThemedText variant="caption" color="muted">
              Your choice is saved to your profile and used when you sign in.
            </ThemedText>
          </View>

          <View style={[styles.cards, { paddingHorizontal: 20 }]}>
            <Animated.View style={shopStyle}>
              <PressableScale
                accessibilityLabel="I am a shopper"
                onPress={() => setChoiceAnimated("customer")}
                style={[
                  styles.card,
                  {
                    borderColor: choice === "customer" ? theme.colors.primary : theme.colors.border,
                    borderWidth: choice === "customer" ? 2.5 : 1,
                    backgroundColor:
                      choice === "customer"
                        ? theme.scheme === "light"
                          ? "rgba(124,58,237,0.08)"
                          : "rgba(124,58,237,0.18)"
                        : theme.colors.surface,
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
            </Animated.View>

            <Animated.View style={sellStyle}>
              <PressableScale
                accessibilityLabel="I am a partner seller"
                onPress={() => setChoiceAnimated("supplier")}
                style={[
                  styles.card,
                  {
                    borderColor: choice === "supplier" ? theme.colors.secondary : theme.colors.border,
                    borderWidth: choice === "supplier" ? 2.5 : 1,
                    backgroundColor:
                      choice === "supplier"
                        ? theme.scheme === "light"
                          ? "rgba(236,72,153,0.08)"
                          : "rgba(236,72,153,0.16)"
                        : theme.colors.surface,
                  },
                ]}
              >
                <View style={[styles.cardIcon, { backgroundColor: theme.colors.secondary }]}>
                  <Ionicons name="storefront-outline" size={26} color="white" />
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <ThemedText variant="headline">Partner</ThemedText>
                  <ThemedText variant="caption" color="muted">
                    List products, manage inventory, and grow with SwipeMarket shoppers.
                  </ThemedText>
                </View>
                {choice === "supplier" ? (
                  <Ionicons name="checkmark-circle" size={24} color={theme.colors.secondary} />
                ) : null}
              </PressableScale>
            </Animated.View>
          </View>

          <View style={{ paddingHorizontal: 20, paddingTop: 28, paddingBottom: 32 }}>
            <PressableScale
              accessibilityLabel="Continue"
              onPress={handleContinue}
              style={{
                borderRadius: theme.radius.pill,
                paddingVertical: 18,
                alignItems: "center",
                backgroundColor:
                  !choice || submitting ? theme.colors.border : theme.colors.primary,
              }}
            >
              <ThemedText variant="label" color="onPrimary">
                {submitting ? "Saving…" : "Continue"}
              </ThemedText>
            </PressableScale>
            {!isGoogle ? (
              <ThemedText variant="caption" color="muted" style={{ textAlign: "center", marginTop: 12 }}>
                {"Tap your photo above to upload a profile image, or we'll use your initials."}
              </ThemedText>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 24 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 16,
  },
  nameRow: { flexDirection: "row", gap: 12, marginTop: 20 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  cards: { gap: 16, marginTop: 8 },
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
