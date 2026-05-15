import { useCallback, useMemo, useState } from "react";
import { Alert, Modal, Pressable, StyleSheet, View } from "react-native";
import { useRouter, useSegments } from "expo-router";
import type { Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { HeaderProfileAvatar } from "@/components/HeaderProfileAvatar";
import { PressableScale } from "@/components/PressableScale";
import { ThemedText } from "@/components/ThemedText";
import { signOutApp } from "@/lib/sign-out";
import { STATUS_ERROR, STATUS_SUCCESS } from "@/lib/status-colors";
import { useTheme } from "@/theme/ThemeContext";

type Props = {
  avatarSize?: number;
  /**
   * From Discover: opens the filter sheet. On other tabs, omit to navigate to
   * Discover when the user picks "Tune discover filters" from the menu.
   */
  onOpenDiscoverFilters?: () => void;
};

type MenuKey = "discover" | "cart" | "orders" | "more";

type MenuItem = {
  key: MenuKey;
  label: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  href: Href;
  replace?: boolean;
};

const SHOPPER_MENU: MenuItem[] = [
  {
    key: "discover",
    label: "Discover",
    subtitle: "Swipe listings and save to cart",
    icon: "sparkles-outline",
    href: "/(customer)/swipe",
    replace: true,
  },
  {
    key: "cart",
    label: "Cart",
    subtitle: "Review items before checkout",
    icon: "bag-handle-outline",
    href: "/(customer)/matches",
  },
  {
    key: "orders",
    label: "My orders",
    subtitle: "Track status from partners in real time",
    icon: "receipt-outline",
    href: "/(customer)/orders",
  },
  {
    key: "more",
    label: "More",
    subtitle: "Account & preferences",
    icon: "ellipsis-horizontal-circle-outline",
    href: "/(customer)/more",
  },
];

/** Avatar opens hub menu (nav, discover filters, sign out). Green badge = signed in. */
export function CustomerHeaderActions({
  avatarSize = 40,
  onOpenDiscoverFilters,
}: Props) {
  const router = useRouter();
  const theme = useTheme();
  const segments = useSegments();
  const [menuOpen, setMenuOpen] = useState(false);

  const activeKey = useMemo((): MenuKey | null => {
    const leaf = segments[segments.length - 1];
    if (leaf === "swipe") return "discover";
    if (leaf === "matches") return "cart";
    if (leaf === "orders") return "orders";
    if (leaf === "more") return "more";
    return null;
  }, [segments]);

  const go = useCallback(
    (item: MenuItem) => {
      setMenuOpen(false);
      if (activeKey === item.key) return;
      if (item.replace) {
        router.replace(item.href);
      } else {
        router.push(item.href);
      }
    },
    [activeKey, router],
  );

  function openFiltersFromMenu() {
    setMenuOpen(false);
    if (onOpenDiscoverFilters) {
      onOpenDiscoverFilters();
      return;
    }
    router.push("/(customer)/swipe");
  }

  function confirmSignOutFromMenu() {
    setMenuOpen(false);
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
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
      <View
        style={[
          styles.avatarWrap,
          { width: avatarSize, height: avatarSize },
        ]}
      >
        <HeaderProfileAvatar
          size={avatarSize}
          onAvatarPress={() => setMenuOpen(true)}
        />
        <View
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no"
          style={[
            styles.activeDot,
            {
              backgroundColor: STATUS_SUCCESS,
              borderColor: theme.colors.background,
            },
          ]}
        />
      </View>

      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}
      >
        <View style={{ flex: 1, justifyContent: "flex-end" }}>
          <Pressable
            accessibilityLabel="Close menu"
            style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(0,0,0,0.45)" }]}
            onPress={() => setMenuOpen(false)}
          />
          <View
            style={{
              backgroundColor: theme.colors.surface,
              borderTopLeftRadius: theme.radius.lg,
              borderTopRightRadius: theme.radius.lg,
              paddingHorizontal: 16,
              paddingTop: 12,
              paddingBottom: 28,
              gap: 4,
            }}
          >
            <View style={{ alignItems: "center", marginBottom: 8 }}>
              <View
                style={{
                  width: 40,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: theme.colors.border,
                }}
              />
            </View>
            <ThemedText variant="label" color="muted" style={{ marginBottom: 8, paddingHorizontal: 4 }}>
              Menu
            </ThemedText>
            {SHOPPER_MENU.map((item) => {
              const active = activeKey === item.key;
              return (
                <PressableScale
                  key={item.key}
                  accessibilityLabel={item.label}
                  onPress={() => go(item)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 14,
                    paddingVertical: 14,
                    paddingHorizontal: 12,
                    borderRadius: theme.radius.md,
                    borderWidth: 1,
                    borderColor: active ? theme.colors.primary : theme.colors.border,
                    backgroundColor: active
                      ? theme.scheme === "light"
                        ? "rgba(124,58,237,0.08)"
                        : "rgba(124,58,237,0.18)"
                      : theme.colors.background,
                  }}
                >
                  <Ionicons name={item.icon} size={24} color={theme.colors.primary} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <ThemedText variant="label">{item.label}</ThemedText>
                    {item.subtitle ? (
                      <ThemedText variant="caption" color="muted">
                        {item.subtitle}
                      </ThemedText>
                    ) : null}
                  </View>
                  {active ? (
                    <Ionicons name="checkmark-circle" size={22} color={theme.colors.primary} />
                  ) : (
                    <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
                  )}
                </PressableScale>
              );
            })}

            <PressableScale
              accessibilityLabel="Tune discover filters"
              onPress={openFiltersFromMenu}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 14,
                paddingVertical: 14,
                paddingHorizontal: 12,
                borderRadius: theme.radius.md,
                borderWidth: 1,
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.background,
                marginTop: 4,
              }}
            >
              <Ionicons name="options-outline" size={24} color={theme.colors.primary} />
              <View style={{ flex: 1, gap: 2 }}>
                <ThemedText variant="label">Tune discover filters</ThemedText>
                <ThemedText variant="caption" color="muted">
                  {onOpenDiscoverFilters
                    ? "Open the filter sheet on Discover"
                    : "Go to Discover to adjust your feed"}
                </ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
            </PressableScale>

            <PressableScale
              accessibilityLabel="Sign out"
              onPress={confirmSignOutFromMenu}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 14,
                paddingVertical: 14,
                paddingHorizontal: 12,
                borderRadius: theme.radius.md,
                borderWidth: 1,
                borderColor: "rgba(220,38,38,0.45)",
                backgroundColor:
                  theme.scheme === "light" ? "rgba(220,38,38,0.06)" : "rgba(220,38,38,0.12)",
                marginTop: 4,
              }}
            >
              <Ionicons name="log-out-outline" size={24} color={STATUS_ERROR} />
              <View style={{ flex: 1, gap: 2 }}>
                <ThemedText variant="label" style={{ color: STATUS_ERROR }}>
                  Sign out
                </ThemedText>
                <ThemedText variant="caption" color="muted">
                  End this session on this device
                </ThemedText>
              </View>
            </PressableScale>

            <PressableScale
              accessibilityLabel="Close menu"
              onPress={() => setMenuOpen(false)}
              style={{ alignItems: "center", paddingVertical: 14 }}
            >
              <ThemedText variant="caption" color="muted">
                Close
              </ThemedText>
            </PressableScale>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  avatarWrap: {
    position: "relative",
  },
  activeDot: {
    position: "absolute",
    right: -1,
    bottom: -1,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    zIndex: 2,
  },
});
