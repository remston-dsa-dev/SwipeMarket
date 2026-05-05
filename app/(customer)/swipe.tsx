import { useCallback, useEffect, useRef, useState } from "react";
import { Dimensions, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useRouter } from "expo-router";
import { ListingCard } from "@/components/ListingCard";
import { PressableScale } from "@/components/PressableScale";
import { QuantitySheet } from "@/components/QuantitySheet";
import { Screen } from "@/components/Screen";
import { SwipeCard } from "@/components/SwipeCard";
import { ThemedText } from "@/components/ThemedText";
import { useListings } from "@/hooks/useListings";
import { useCartStore } from "@/stores/cart-store";
import { useSessionStore } from "@/stores/session-store";
import { useTheme } from "@/theme/ThemeContext";
import type { Listing } from "@/types/listing";

const { width } = Dimensions.get("window");

export default function SwipeScreen() {
  const router = useRouter();
  const theme = useTheme();
  const clearSession = useSessionStore((s) => s.clearSession);
  const { data: listings } = useListings();
  const addItem = useCartStore((s) => s.addItem);
  const cartItems = useCartStore((s) => s.items);

  const [index, setIndex] = useState(0);
  const [sheetListing, setSheetListing] = useState<Listing | null>(null);
  const [qty, setQty] = useState(1);

  // Refs for stable worklet access
  const listingsRef = useRef<Listing[]>([]);
  const indexRef = useRef(0);
  useEffect(() => { listingsRef.current = listings; }, [listings]);
  useEffect(() => { indexRef.current = index; }, [index]);

  const translateX = useSharedValue(0);
  const rotateZ = useSharedValue(0);

  const current = listings[index];
  const next = listings[index + 1];
  const afterNext = listings[index + 2];

  const cartCount = cartItems.reduce((sum, i) => sum + i.qty, 0);

  const advance = useCallback(() => {
    translateX.value = 0;
    rotateZ.value = 0;
    setIndex((i) => i + 1);
  }, [translateX, rotateZ]);

  const dismissLeft = useCallback(() => {
    translateX.value = withTiming(-width * 1.4, { duration: 220 }, (done) => {
      if (done) runOnJS(advance)();
    });
    rotateZ.value = withTiming(-14, { duration: 220 });
  }, [advance, translateX, rotateZ]);

  const dismissRight = useCallback(() => {
    translateX.value = withTiming(width * 1.4, { duration: 220 }, (done) => {
      if (done) runOnJS(advance)();
    });
    rotateZ.value = withTiming(14, { duration: 220 });
  }, [advance, translateX, rotateZ]);

  // Stable identity: reads from refs so the gesture closure never goes stale
  const openSheetForCurrent = useCallback(() => {
    const listing = listingsRef.current[indexRef.current];
    if (listing) {
      setQty(1);
      setSheetListing(listing);
    }
  }, []);

  const snapToLikePosition = useCallback(() => {
    translateX.value = withSpring(80);
    rotateZ.value = withSpring(8);
  }, [translateX, rotateZ]);

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = e.translationX;
      rotateZ.value = (e.translationX / width) * 12;
    })
    .onEnd((e) => {
      const big = Math.abs(e.translationX) > width * 0.22;
      const fast = Math.abs(e.velocityX) > 650;
      if (big || fast) {
        if (e.translationX > 0) {
          translateX.value = withSpring(80);
          rotateZ.value = withSpring(8);
          runOnJS(openSheetForCurrent)();
        } else {
          translateX.value = withTiming(-width * 1.4, { duration: 220 }, (done) => {
            if (done) runOnJS(advance)();
          });
          rotateZ.value = withTiming(-14, { duration: 220 });
        }
      } else {
        translateX.value = withSpring(0);
        rotateZ.value = withSpring(0);
      }
    });

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { rotateZ: `${rotateZ.value}deg` },
    ],
  }));

  function handleConfirm() {
    if (!sheetListing) return;
    addItem(
      {
        listingId: sheetListing.id,
        title: sheetListing.title,
        priceLabel: sheetListing.priceLabel,
        imageUrl: sheetListing.imageUrl,
        unitPriceCents: sheetListing.unitPriceCents,
      },
      qty,
    );
    setSheetListing(null);
    dismissRight();
  }

  function handleSkip() {
    setSheetListing(null);
    translateX.value = withSpring(0);
    rotateZ.value = withSpring(0);
  }

  function handleLikeButton() {
    if (!current) return;
    snapToLikePosition();
    openSheetForCurrent();
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
          <ThemedText variant="headline">Discover</ThemedText>
          {current ? (
            <ThemedText variant="caption" color="muted">
              {listings.length - index} listing
              {listings.length - index !== 1 ? "s" : ""} left
            </ThemedText>
          ) : null}
        </View>

        <PressableScale
          accessibilityLabel="Open cart"
          onPress={() => router.push("/matches")}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderRadius: theme.radius.pill,
            borderWidth: 1,
            borderColor: theme.colors.glassBorder,
            backgroundColor: theme.colors.overlay,
          }}
        >
          <ThemedText variant="caption">Cart</ThemedText>
          {cartCount > 0 && (
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: theme.colors.primary,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ThemedText
                variant="caption"
                color="onPrimary"
                style={{ fontSize: 11, lineHeight: 14 }}
              >
                {cartCount > 99 ? "99+" : cartCount}
              </ThemedText>
            </View>
          )}
        </PressableScale>
      </View>

      {/* Card stack */}
      <View style={{ flex: 1, justifyContent: "center" }}>
        {current ? (
          <View style={{ height: 500, justifyContent: "center" }}>
            {/* Third card — peek */}
            {afterNext ? (
              <View
                style={{
                  position: "absolute",
                  width: "100%",
                  transform: [{ scale: 0.88 }],
                  opacity: 0.55,
                }}
                pointerEvents="none"
              >
                <ListingCard listing={afterNext} />
              </View>
            ) : null}

            {/* Second card — peek */}
            {next ? (
              <View
                style={{
                  position: "absolute",
                  width: "100%",
                  transform: [{ scale: 0.94 }],
                  opacity: 0.8,
                }}
                pointerEvents="none"
              >
                <ListingCard listing={next} />
              </View>
            ) : null}

            {/* Current card — swipeable */}
            <GestureDetector gesture={panGesture}>
              <Animated.View style={[animatedCardStyle, { width: "100%" }]}>
                <SwipeCard listing={current} translateX={translateX} />
              </Animated.View>
            </GestureDetector>
          </View>
        ) : (
          /* Empty state */
          <View style={{ gap: 16 }}>
            <ThemedText variant="headline">All caught up!</ThemedText>
            <ThemedText variant="body" color="muted">
              {cartCount > 0
                ? `You have ${cartCount} item${cartCount !== 1 ? "s" : ""} waiting in your cart.`
                : "New listings will appear when suppliers add products."}
            </ThemedText>
            {cartCount > 0 && (
              <PressableScale
                accessibilityLabel="View cart"
                onPress={() => router.push("/matches")}
                style={{
                  alignSelf: "flex-start",
                  paddingHorizontal: 20,
                  paddingVertical: 12,
                  borderRadius: theme.radius.md,
                  backgroundColor: theme.colors.primary,
                }}
              >
                <ThemedText variant="label" color="onPrimary">
                  View Cart →
                </ThemedText>
              </PressableScale>
            )}
            <PressableScale
              accessibilityLabel="Sign out"
              onPress={() => {
                clearSession();
                router.replace("/sign-in");
              }}
              style={{
                alignSelf: "flex-start",
                paddingHorizontal: 20,
                paddingVertical: 12,
                borderRadius: theme.radius.md,
                borderWidth: 1,
                borderColor: theme.colors.border,
              }}
            >
              <ThemedText variant="label">Sign out</ThemedText>
            </PressableScale>
          </View>
        )}
      </View>

      {/* Action buttons */}
      {current ? (
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            gap: 48,
            paddingBottom: 12,
          }}
        >
          <PressableScale
            accessibilityLabel="Dislike — pass on this listing"
            onPress={dismissLeft}
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 2.5,
              borderColor: "#EF4444",
              backgroundColor: theme.colors.surface,
            }}
          >
            <ThemedText variant="headline" style={{ color: "#EF4444" }}>
              ✕
            </ThemedText>
          </PressableScale>

          <PressableScale
            accessibilityLabel="Like — add to cart"
            onPress={handleLikeButton}
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: theme.colors.primary,
            }}
          >
            <ThemedText variant="headline" color="onPrimary">
              ♥
            </ThemedText>
          </PressableScale>
        </View>
      ) : null}

      {/* Qty sheet */}
      <QuantitySheet
        listing={sheetListing}
        qty={qty}
        onIncrement={() => setQty((q) => q + 1)}
        onDecrement={() => setQty((q) => Math.max(1, q - 1))}
        onConfirm={handleConfirm}
        onCancel={handleSkip}
      />
    </Screen>
  );
}
