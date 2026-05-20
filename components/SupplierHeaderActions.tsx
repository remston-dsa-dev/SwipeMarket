import { useCallback, useMemo, useState } from "react";
import { Alert, Modal, Pressable, StyleSheet, View } from "react-native";
import { useRouter, useSegments } from "expo-router";
import type { Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { HeaderProfileAvatar } from "@/components/HeaderProfileAvatar";
import { PressableScale } from "@/components/PressableScale";
import { ThemedText } from "@/components/ThemedText";
import { useSupplierReturns } from "@/hooks/useReturnRequests";
import { useSupplierOrders } from "@/hooks/useSupplierOrders";
import { useSupplierProducts } from "@/hooks/useSupplierProducts";
import { signOutApp } from "@/lib/sign-out";
import { STATUS_ERROR, STATUS_SUCCESS } from "@/lib/status-colors";
import { useSessionStore } from "@/stores/session-store";
import { useTheme } from "@/theme/ThemeContext";

type Props = {
  avatarSize?: number;
};

type MenuKey = "dashboard" | "addProduct" | "orders" | "returns" | "more";

type MenuItem = {
  key: MenuKey;
  label: string;
  caption: string;
  icon: keyof typeof Ionicons.glyphMap;
  href: Href;
  /** Dashboard is the partner home root — avoid stacking duplicates. */
  replace?: boolean;
  /** When false, no count chip (e.g. quick actions, settings hub). */
  showCount?: boolean;
};

const SUPPLIER_MENU: MenuItem[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    caption: "Listings, stock levels & pricing",
    icon: "grid",
    href: "/(supplier)/dashboard",
    replace: true,
  },
  {
    key: "addProduct",
    label: "New listing",
    caption: "Photos, price & units for Discover",
    icon: "add-circle",
    href: "/(supplier)/add-product",
    showCount: false,
  },
  {
    key: "orders",
    label: "Orders",
    caption: "Shopper checkouts & fulfillment",
    icon: "receipt",
    href: "/(supplier)/orders",
  },
  {
    key: "returns",
    label: "Returns",
    caption: "Refunds & reverse logistics",
    icon: "return-down-back",
    href: "/(supplier)/returns",
  },
  {
    key: "more",
    label: "More",
    caption: "Payouts, notifications & account",
    icon: "ellipsis-horizontal-circle",
    href: "/(supplier)/more",
    showCount: false,
  },
];

const SIGN_OUT_CAPTION = "End this session on this device";

/** Avatar opens partner hub (nav + sign out). Green dot = signed in. */
export function SupplierHeaderActions({ avatarSize = 40 }: Props) {
  const router = useRouter();
  const theme = useTheme();
  const segments = useSegments();
  const [menuOpen, setMenuOpen] = useState(false);
  const supplierId = useSessionStore((s) => s.userId);
  const { data: orders = [] } = useSupplierOrders(supplierId);
  const { data: products = [] } = useSupplierProducts(supplierId);
  const { data: returns = [] } = useSupplierReturns(supplierId);

  const menuCounts = useMemo(
    (): Record<MenuKey, number> => ({
      dashboard: products.length,
      addProduct: 0,
      orders: orders.length,
      returns: returns.filter((r) => r.status === "requested").length,
      more: 0,
    }),
    [orders.length, products.length, returns],
  );

  const activeKey = useMemo((): MenuKey | null => {
    const leaf = segments[segments.length - 1];
    if (leaf === "dashboard") return "dashboard";
    if (leaf === "add-product") return "addProduct";
    if (leaf === "orders") return "orders";
    if (leaf === "returns") return "returns";
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
              paddingTop: 10,
              paddingBottom: 24,
              gap: 6,
            }}
          >
            <View style={{ alignItems: "center", marginBottom: 4 }}>
              <View
                style={{
                  width: 40,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: theme.colors.border,
                }}
              />
            </View>

            {SUPPLIER_MENU.map((item) => {
              const active = activeKey === item.key;
              const showCount = item.showCount !== false;
              const count = showCount ? menuCounts[item.key] : 0;
              const capped = count > 99 ? "99+" : String(count);
              const a11yLabel = showCount
                ? `${item.label}, ${capped}. ${item.caption}`
                : `${item.label}. ${item.caption}`;
              return (
                <PressableScale
                  key={item.key}
                  accessibilityLabel={a11yLabel}
                  onPress={() => go(item)}
                  style={{
                    flexDirection: "row",
                    alignItems: "flex-start",
                    gap: 12,
                    paddingVertical: 12,
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
                  <Ionicons
                    name={item.icon}
                    size={22}
                    color={theme.colors.primary}
                    style={{ marginTop: 2 }}
                  />
                  <View style={{ flex: 1, gap: 4, minWidth: 0 }}>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 10,
                      }}
                    >
                      <ThemedText variant="label" numberOfLines={1} style={{ flexShrink: 1 }}>
                        {item.label}
                      </ThemedText>
                      {showCount ? (
                        <View
                          style={{
                            minWidth: 28,
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: theme.radius.pill,
                            borderWidth: count > 0 ? 0 : 1,
                            borderColor: theme.colors.border,
                            backgroundColor:
                              count > 0 ? theme.colors.primary : theme.colors.surface,
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <ThemedText
                            variant="caption"
                            color={count > 0 ? "onPrimary" : "muted"}
                            style={{
                              fontWeight: "700",
                              fontVariant: ["tabular-nums"],
                              fontSize: 12,
                              lineHeight: 14,
                            }}
                          >
                            {capped}
                          </ThemedText>
                        </View>
                      ) : null}
                    </View>
                    <ThemedText variant="caption" color="muted" numberOfLines={2}>
                      {item.caption}
                    </ThemedText>
                  </View>
                  <View style={{ marginTop: 2 }}>
                    {active ? (
                      <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
                    ) : (
                      <Ionicons name="chevron-forward" size={18} color={theme.colors.textSecondary} />
                    )}
                  </View>
                </PressableScale>
              );
            })}

            <PressableScale
              accessibilityLabel={`Sign out. ${SIGN_OUT_CAPTION}`}
              onPress={confirmSignOutFromMenu}
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                gap: 12,
                paddingVertical: 12,
                paddingHorizontal: 12,
                borderRadius: theme.radius.md,
                borderWidth: 1,
                borderColor: "rgba(220,38,38,0.45)",
                backgroundColor:
                  theme.scheme === "light" ? "rgba(220,38,38,0.06)" : "rgba(220,38,38,0.12)",
                marginTop: 2,
              }}
            >
              <Ionicons name="log-out" size={22} color={STATUS_ERROR} style={{ marginTop: 2 }} />
              <View style={{ flex: 1, gap: 4 }}>
                <ThemedText variant="label" style={{ color: STATUS_ERROR }}>
                  Sign out
                </ThemedText>
                <ThemedText variant="caption" color="muted">
                  {SIGN_OUT_CAPTION}
                </ThemedText>
              </View>
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
