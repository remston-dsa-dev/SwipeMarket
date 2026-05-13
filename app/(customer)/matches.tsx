import { Alert, FlatList, View } from "react-native";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { CartItemRow } from "@/components/CartItemRow";
import { HeaderProfileAvatar } from "@/components/HeaderProfileAvatar";
import { PressableScale } from "@/components/PressableScale";
import { Screen } from "@/components/Screen";
import { ThemedText } from "@/components/ThemedText";
import {
  checkoutCartRemote,
  clearMyServerCart,
  setCartLineQtyRemote,
} from "@/lib/cart-remote";
import { isSupabaseConfigured } from "@/lib/is-supabase-configured";
import { useCartStore } from "@/stores/cart-store";
import { useTheme } from "@/theme/ThemeContext";

export default function CartScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const theme = useTheme();
  const items = useCartStore((s) => s.items);
  const totalCents = useCartStore((s) => s.totalCents);
  const removeItem = useCartStore((s) => s.removeItem);
  const clearCart = useCartStore((s) => s.clearCart);
  const itemCount = items.reduce((sum, i) => sum + i.qty, 0);

  async function removeLineFromCart(listingId: string) {
    if (isSupabaseConfigured()) {
      try {
        await setCartLineQtyRemote(listingId, 0);
      } catch (e) {
        Alert.alert("Could not update cart", (e as Error).message);
        return;
      }
    }
    removeItem(listingId);
  }

  async function clearEntireCart() {
    if (isSupabaseConfigured()) {
      try {
        await clearMyServerCart();
      } catch (e) {
        Alert.alert("Could not clear cart", (e as Error).message);
        return;
      }
    }
    clearCart();
  }

  function handleCheckout() {
    if (!isSupabaseConfigured()) {
      Alert.alert(
        "Demo checkout",
        "Connect Supabase in .env to reserve inventory on swipes and allocate on checkout.",
        [
          {
            text: "Clear cart",
            style: "destructive",
            onPress: () => {
              clearCart();
              router.back();
            },
          },
          { text: "Keep shopping", onPress: () => router.back() },
        ],
      );
      return;
    }

    Alert.alert(
      "Complete checkout?",
      "This will move cart quantities from on-hold to allocated for suppliers.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Checkout",
          onPress: () => {
            void (async () => {
              try {
                await checkoutCartRemote();
                clearCart();
                void queryClient.invalidateQueries({ queryKey: ["listings"] });
                void queryClient.invalidateQueries({ queryKey: ["supplier-products"] });
                router.back();
              } catch (e) {
                Alert.alert("Checkout failed", (e as Error).message);
              }
            })();
          },
        },
      ],
    );
  }

  return (
    <Screen>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <View style={{ gap: 4 }}>
          <ThemedText variant="headline">Your Cart</ThemedText>
          {itemCount > 0 && (
            <ThemedText variant="caption" color="muted">
              {itemCount} item{itemCount !== 1 ? "s" : ""}
            </ThemedText>
          )}
        </View>

        <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
          {items.length > 0 && (
            <PressableScale
              accessibilityLabel="Clear cart"
              onPress={() =>
                Alert.alert("Clear cart?", "Remove all items?", [
                  { text: "Cancel", style: "cancel" },
                  { text: "Clear", style: "destructive", onPress: () => void clearEntireCart() },
                ])
              }
              style={{
                paddingHorizontal: 12,
                paddingVertical: 7,
                borderRadius: theme.radius.sm,
                borderWidth: 1,
                borderColor: "#EF4444",
              }}
            >
              <ThemedText variant="caption" style={{ color: "#EF4444" }}>
                Clear
              </ThemedText>
            </PressableScale>
          )}

          <PressableScale
            accessibilityLabel="Go back"
            onPress={() => router.back()}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 7,
              borderRadius: theme.radius.sm,
              borderWidth: 1,
              borderColor: theme.colors.border,
            }}
          >
            <ThemedText variant="caption">← Back</ThemedText>
          </PressableScale>

          <HeaderProfileAvatar />
        </View>
      </View>

      {items.length === 0 ? (
        /* Empty state */
        <View style={{ flex: 1, justifyContent: "center", gap: 14 }}>
          <ThemedText variant="headline">Nothing here yet</ThemedText>
          <ThemedText variant="body" color="muted">
            Swipe right on listings you love and set the quantity — they'll
            appear here.
          </ThemedText>
          <PressableScale
            accessibilityLabel="Start swiping"
            onPress={() => router.back()}
            style={{
              alignSelf: "flex-start",
              paddingHorizontal: 20,
              paddingVertical: 12,
              borderRadius: theme.radius.md,
              backgroundColor: theme.colors.primary,
            }}
          >
            <ThemedText variant="label" color="onPrimary">
              Start swiping
            </ThemedText>
          </PressableScale>
        </View>
      ) : (
        <>
          <FlatList
            data={items}
            keyExtractor={(item) => item.listingId}
            renderItem={({ item }) => (
              <CartItemRow item={item} onRemove={() => void removeLineFromCart(item.listingId)} />
            )}
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
          />

          {/* Footer */}
          <View
            style={{
              paddingTop: 16,
              gap: 12,
              borderTopWidth: 1,
              borderTopColor: theme.colors.border,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <ThemedText variant="label">Total</ThemedText>
              <ThemedText variant="headline">
                ${(totalCents / 100).toFixed(2)}
              </ThemedText>
            </View>

            <PressableScale
              accessibilityLabel="Checkout"
              onPress={handleCheckout}
              style={{
                paddingVertical: 16,
                borderRadius: theme.radius.md,
                backgroundColor: theme.colors.primary,
                alignItems: "center",
              }}
            >
              <ThemedText variant="label" color="onPrimary">
                Checkout · ${(totalCents / 100).toFixed(2)}
              </ThemedText>
            </PressableScale>
          </View>
        </>
      )}
    </Screen>
  );
}
