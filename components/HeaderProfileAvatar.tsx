import { useEffect, useState } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import { UserAvatar } from "@/components/UserAvatar";
import {
  displayNameFromUserMetadata,
  googlePictureFromMetadata,
} from "@/lib/avatar-helpers";
import { isSupabaseConfigured } from "@/lib/is-supabase-configured";
import { signOutApp } from "@/lib/sign-out";
import { supabase } from "@/lib/supabase";
import { useSessionStore } from "@/stores/session-store";

type Props = {
  /** Avatar diameter (default 40). */
  size?: number;
};

/**
 * Profile photo + initials in the header; tap confirms sign-out (same pattern as Inventory’s old control).
 */
export function HeaderProfileAvatar({ size = 40 }: Props) {
  const router = useRouter();
  const userId = useSessionStore((s) => s.userId);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [label, setLabel] = useState("");

  useEffect(() => {
    let cancelled = false;
    if (!userId || !isSupabaseConfigured()) {
      setImageUri(null);
      setLabel("");
      return;
    }
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled || !user) return;

      const meta = user.user_metadata as Record<string, unknown>;
      let name = displayNameFromUserMetadata(meta);
      let remote = googlePictureFromMetadata(meta);

      const { data: prof } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", userId)
        .maybeSingle();
      if (cancelled) return;

      if (prof?.avatar_url?.trim()) remote = prof.avatar_url.trim();
      if (prof?.full_name?.trim()) name = prof.full_name.trim();
      if (!name.trim()) {
        const local = user.email?.split("@")[0];
        name = local?.trim() ? local : "Member";
      }

      setImageUri(remote);
      setLabel(name);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (!userId) return null;

  function confirmSignOut() {
    Alert.alert(
      "Sign out?",
      "You will need to sign in again to use SwipeMarket.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign out",
          style: "destructive",
          onPress: () => {
            void signOutApp().then(() => router.replace("/(auth)/sign-in"));
          },
        },
      ],
    );
  }

  return (
    <UserAvatar
      imageUri={imageUri}
      displayName={label || "Member"}
      size={size}
      editable
      accessibilityLabel="Account: sign out"
      onPress={confirmSignOut}
    />
  );
}
