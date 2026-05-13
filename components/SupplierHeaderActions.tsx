import { useCallback, useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { useRouter, useSegments } from "expo-router";
import type { Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { HeaderProfileAvatar } from "@/components/HeaderProfileAvatar";
import { PressableScale } from "@/components/PressableScale";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/theme/ThemeContext";

type Props = {
  avatarSize?: number;
};

type MenuKey = "orders" | "returns" | "dashboard" | "more";

type MenuItem = {
  key: MenuKey;
  label: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  href: Href;
  /** Use replace so stack does not pile up when going “home”. */
  replace?: boolean;
};

const SUPPLIER_MENU: MenuItem[] = [
  {
    key: "orders",
    label: "Orders",
    subtitle: "Shopper checkouts & fulfillment",
    icon: "receipt-outline",
    href: "/(supplier)/orders",
  },
  {
    key: "returns",
    label: "Returns",
    subtitle: "Refunds & reverse logistics",
    icon: "return-down-back-outline",
    href: "/(supplier)/returns",
  },
  {
    key: "dashboard",
    label: "Dashboard",
    subtitle: "Inventory & catalog",
    icon: "grid-outline",
    href: "/(supplier)/dashboard",
    replace: true,
  },
  {
    key: "more",
    label: "More",
    subtitle: "Settings & tools",
    icon: "ellipsis-horizontal-circle-outline",
    href: "/(supplier)/more",
  },
];

/** Hamburger opens supplier menu; avatar is separate (sign out). */
export function SupplierHeaderActions({ avatarSize = 40 }: Props) {
  const router = useRouter();
  const theme = useTheme();
  const segments = useSegments();
  const [menuOpen, setMenuOpen] = useState(false);

  const activeKey = useMemo((): MenuKey | null => {
    const leaf = segments[segments.length - 1];
    if (leaf === "orders") return "orders";
    if (leaf === "returns") return "returns";
    if (leaf === "dashboard") return "dashboard";
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

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
      <PressableScale
        accessibilityLabel="Supplier menu"
        onPress={() => setMenuOpen(true)}
        style={{ paddingVertical: 8, paddingHorizontal: 6 }}
      >
        <Ionicons name="menu" size={28} color={theme.colors.textSecondary} />
      </PressableScale>
      <HeaderProfileAvatar size={avatarSize} />

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
              Partner hub
            </ThemedText>
            {SUPPLIER_MENU.map((item) => {
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
              accessibilityLabel="Close supplier menu"
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
