import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Dimensions, Modal, ScrollView, StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Extrapolation,
  interpolate,
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
import { useInventoryStore } from "@/stores/inventory-store";
import { useSessionStore } from "@/stores/session-store";
import { useTheme } from "@/theme/ThemeContext";
import type { Listing } from "@/types/listing";

const { width } = Dimensions.get("window");

const PRICE_BUCKETS = [
  { key: "all",     label: "Any price", min: 0,     max: Number.POSITIVE_INFINITY },
  { key: "budget",  label: "Under $50", min: 0,     max: 5000                     },
  { key: "mid",     label: "$50 - $150", min: 5000,  max: 15000                   },
  { key: "premium", label: "$150+",      min: 15000, max: Number.POSITIVE_INFINITY },
] as const;

export default function SwipeScreen() {
  const router       = useRouter();
  const theme        = useTheme();
  const clearSession = useSessionStore((s) => s.clearSession);
  const { data: listings } = useListings();
  const products   = useInventoryStore((s) => s.products);
  const addItem    = useCartStore((s) => s.addItem);
  const cartItems  = useCartStore((s) => s.items);

  const [index,                     setIndex]                     = useState(0);
  const [sheetListing,              setSheetListing]              = useState<Listing | null>(null);
  const [qty,                       setQty]                       = useState(1);
  const [filtersOpen,               setFiltersOpen]               = useState(false);
  const [selectedParentCategories,  setSelectedParentCategories]  = useState<string[]>([]);
  const [selectedSubCategories,     setSelectedSubCategories]     = useState<string[]>([]);
  const [selectedAttributes,        setSelectedAttributes]        = useState<string[]>([]);
  const [selectedVariants,          setSelectedVariants]          = useState<string[]>([]);
  const [selectedUnits,             setSelectedUnits]             = useState<string[]>([]);
  const [priceBucket,               setPriceBucket]               = useState<(typeof PRICE_BUCKETS)[number]["key"]>("all");
  const [hasVariantsOnly,           setHasVariantsOnly]           = useState(false);

  const parentCategories = useMemo(
    () =>
      Array.from(
        new Set(
          products
            .map((p) => p.parentCategory ?? p.category)
            .filter((v): v is string => !!v),
        ),
      ).sort(),
    [products],
  );
  const subCategories = useMemo(
    () => Array.from(new Set(listings.map((l) => l.subCategory).filter((v): v is string => !!v))).sort(),
    [listings],
  );
  const attributes = useMemo(
    () => Array.from(new Set(listings.flatMap((l) => l.attributes ?? []))).sort(),
    [listings],
  );
  const variants = useMemo(
    () => Array.from(new Set(listings.flatMap((l) => l.variants ?? []))).sort(),
    [listings],
  );
  const units = useMemo(
    () => Array.from(new Set(listings.map((l) => l.unit).filter((v): v is string => !!v))).sort(),
    [listings],
  );

  const activePrice = PRICE_BUCKETS.find((b) => b.key === priceBucket) ?? PRICE_BUCKETS[0];

  const filteredListings = useMemo(
    () =>
      listings.filter((listing) => {
        if (hasVariantsOnly && (listing.variants?.length ?? 0) === 0) return false;
        const lpc = listing.parentCategory ?? listing.category;
        if (selectedParentCategories.length > 0 && (!lpc || !selectedParentCategories.includes(lpc))) return false;
        if (selectedSubCategories.length > 0 && (!listing.subCategory || !selectedSubCategories.includes(listing.subCategory))) return false;
        if (selectedAttributes.length > 0 && !selectedAttributes.every((v) => (listing.attributes ?? []).includes(v))) return false;
        if (selectedVariants.length > 0 && !selectedVariants.some((v) => (listing.variants ?? []).includes(v))) return false;
        if (selectedUnits.length > 0 && (!listing.unit || !selectedUnits.includes(listing.unit))) return false;
        return listing.unitPriceCents >= activePrice.min && listing.unitPriceCents <= activePrice.max;
      }),
    [activePrice.max, activePrice.min, hasVariantsOnly, listings,
     selectedAttributes, selectedParentCategories, selectedSubCategories, selectedUnits, selectedVariants],
  );

  // Refs for stable worklet closures
  const listingsRef = useRef<Listing[]>([]);
  const indexRef    = useRef(0);
  useEffect(() => { listingsRef.current = filteredListings; }, [filteredListings]);
  useEffect(() => { indexRef.current   = index; },            [index]);

  const translateX    = useSharedValue(0);
  const rotateZ       = useSharedValue(0);
  const dragProgressX = useSharedValue(0);

  // Reset index when filter set changes
  useEffect(() => {
    setIndex(0);
  }, [filteredListings]);

  // Reset shared values AFTER React has committed the new index
  // — runs on every index change, including the filter reset above
  useEffect(() => {
    translateX.value    = 0;
    rotateZ.value       = 0;
    dragProgressX.value = 0;
  }, [index, dragProgressX, rotateZ, translateX]);

  const current   = filteredListings[index];
  const next      = filteredListings[index + 1];
  const afterNext = filteredListings[index + 2];

  const cartCount = cartItems.reduce((s, i) => s + i.qty, 0);
  const activeFiltersCount =
    selectedParentCategories.length + selectedSubCategories.length +
    selectedAttributes.length      + selectedVariants.length +
    selectedUnits.length           + (priceBucket === "all" ? 0 : 1) +
    (hasVariantsOnly ? 1 : 0);

  // ── advance: just bump the index — shared value reset happens in useEffect([index])
  const advance = useCallback(() => {
    setIndex((i) => i + 1);
  }, []);

  // ── dismiss animations: drive dragProgressX to full promotion (width*0.5)
  //    simultaneously with the fly-off so background cards animate up smoothly
  const dismissLeft = useCallback(() => {
    dragProgressX.value = withTiming(width * 0.5, { duration: 200 });
    translateX.value    = withTiming(-width * 1.5, { duration: 260 }, (done) => {
      if (done) runOnJS(advance)();
    });
    rotateZ.value = withTiming(-18, { duration: 260 });
  }, [advance, dragProgressX, rotateZ, translateX]);

  const dismissRight = useCallback(() => {
    dragProgressX.value = withTiming(width * 0.5, { duration: 200 });
    translateX.value    = withTiming(width * 1.5, { duration: 260 }, (done) => {
      if (done) runOnJS(advance)();
    });
    rotateZ.value = withTiming(18, { duration: 260 });
  }, [advance, dragProgressX, rotateZ, translateX]);

  // Stable ref-based opener — safe to capture once in the gesture worklet
  const openSheetForCurrent = useCallback(() => {
    const listing = listingsRef.current[indexRef.current];
    if (listing) { setQty(1); setSheetListing(listing); }
  }, []);

  const snapToLikePosition = useCallback(() => {
    translateX.value = withSpring(80);
    rotateZ.value    = withSpring(8);
  }, [translateX, rotateZ]);

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value    = e.translationX;
      dragProgressX.value = e.translationX;
      rotateZ.value       = (e.translationX / width) * 14;
    })
    .onEnd((e) => {
      const big  = Math.abs(e.translationX) > width * 0.22;
      const fast = Math.abs(e.velocityX)    > 650;
      if (big || fast) {
        if (e.translationX > 0) {
          // Right swipe → open quantity sheet, card snaps to like position
          dragProgressX.value = withSpring(0);
          translateX.value    = withSpring(80);
          rotateZ.value       = withSpring(8);
          runOnJS(openSheetForCurrent)();
        } else {
          // Left swipe → dismiss with smooth promotion
          dragProgressX.value = withTiming(width * 0.5, { duration: 200 });
          translateX.value    = withTiming(-width * 1.5, { duration: 260 }, (done) => {
            if (done) runOnJS(advance)();
          });
          rotateZ.value = withTiming(-18, { duration: 260 });
        }
      } else {
        // Snap back
        dragProgressX.value = withSpring(0);
        translateX.value    = withSpring(0);
        rotateZ.value       = withSpring(0);
      }
    });

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { rotateZ: `${rotateZ.value}deg` },
    ],
  }));

  // Tinder-style: background cards scale up AND rise (translateY → 0) as top card is dragged
  const nextCardAnimatedStyle = useAnimatedStyle(() => {
    const p = Math.min(Math.abs(dragProgressX.value) / (width * 0.5), 1);
    return {
      transform: [
        { scale:      interpolate(p, [0, 1], [0.95, 1.00], Extrapolation.CLAMP) },
        { translateY: interpolate(p, [0, 1], [14,   0],    Extrapolation.CLAMP) },
      ],
      opacity: interpolate(p, [0, 1], [0.85, 1.0], Extrapolation.CLAMP),
    };
  });

  const afterCardAnimatedStyle = useAnimatedStyle(() => {
    const p = Math.min(Math.abs(dragProgressX.value) / (width * 0.5), 1);
    return {
      transform: [
        { scale:      interpolate(p, [0, 1], [0.90, 0.95], Extrapolation.CLAMP) },
        { translateY: interpolate(p, [0, 1], [28,   14],   Extrapolation.CLAMP) },
      ],
      opacity: interpolate(p, [0, 1], [0.65, 0.85], Extrapolation.CLAMP),
    };
  });

  function handleConfirm() {
    if (!sheetListing) return;
    addItem(
      {
        listingId:      sheetListing.id,
        title:          sheetListing.title,
        priceLabel:     sheetListing.priceLabel,
        imageUrl:       sheetListing.imageUrl,
        unitPriceCents: sheetListing.unitPriceCents,
      },
      qty,
    );
    setSheetListing(null);
    dismissRight();
  }

  function handleSkip() {
    setSheetListing(null);
    dragProgressX.value = withSpring(0);
    translateX.value    = withSpring(0);
    rotateZ.value       = withSpring(0);
  }

  function handleLikeButton() {
    if (!current) return;
    snapToLikePosition();
    openSheetForCurrent();
  }

  function toggleFilter(value: string, selected: string[], setter: (next: string[]) => void) {
    setter(selected.includes(value) ? selected.filter((i) => i !== value) : [...selected, value]);
  }

  function clearFilters() {
    setSelectedParentCategories([]);
    setSelectedSubCategories([]);
    setSelectedAttributes([]);
    setSelectedVariants([]);
    setSelectedUnits([]);
    setPriceBucket("all");
    setHasVariantsOnly(false);
  }

  return (
    <Screen>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ gap: 4 }}>
          <ThemedText variant="headline">Discover</ThemedText>
          {current ? (
            <ThemedText variant="caption" color="muted">
              {filteredListings.length - index} listing
              {filteredListings.length - index !== 1 ? "s" : ""} left
            </ThemedText>
          ) : null}
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <PressableScale
            accessibilityLabel="Open discover filters"
            onPress={() => setFiltersOpen((p) => !p)}
            style={[styles.headerBtn, { borderColor: theme.colors.glassBorder, backgroundColor: theme.colors.overlay }]}
          >
            <ThemedText variant="caption">Filters</ThemedText>
            {activeFiltersCount > 0 && (
              <View style={[styles.badge, { backgroundColor: theme.colors.primary }]}>
                <ThemedText variant="caption" color="onPrimary" style={{ fontSize: 10, lineHeight: 12 }}>
                  {activeFiltersCount}
                </ThemedText>
              </View>
            )}
          </PressableScale>

          <PressableScale
            accessibilityLabel="Open cart"
            onPress={() => router.push("/matches")}
            style={[styles.headerBtn, { borderColor: theme.colors.glassBorder, backgroundColor: theme.colors.overlay }]}
          >
            <ThemedText variant="caption">Cart</ThemedText>
            {cartCount > 0 && (
              <View style={[styles.badge, { backgroundColor: theme.colors.primary }]}>
                <ThemedText variant="caption" color="onPrimary" style={{ fontSize: 11, lineHeight: 14 }}>
                  {cartCount > 99 ? "99+" : cartCount}
                </ThemedText>
              </View>
            )}
          </PressableScale>
        </View>
      </View>

      {/* Card stack */}
      <View style={{ flex: 1, justifyContent: "center" }}>
        {current ? (
          <View style={styles.deckContainer}>
            {/*
             * Three fixed slots — keys are NEVER based on listing id.
             * React keeps the same DOM nodes across advances, so images
             * stay mounted and never flash on promotion.
             */}

            {/* Slot 2 — deepest */}
            <Animated.View style={[StyleSheet.absoluteFill, afterCardAnimatedStyle]} pointerEvents="none">
              {afterNext ? <ListingCard listing={afterNext} /> : null}
            </Animated.View>

            {/* Slot 1 — middle */}
            <Animated.View style={[StyleSheet.absoluteFill, nextCardAnimatedStyle]} pointerEvents="none">
              {next ? <ListingCard listing={next} /> : null}
            </Animated.View>

            {/* Slot 0 — top, swipeable */}
            <GestureDetector gesture={panGesture}>
              <Animated.View style={[StyleSheet.absoluteFill, animatedCardStyle]}>
                <SwipeCard listing={current} translateX={translateX} />
              </Animated.View>
            </GestureDetector>
          </View>
        ) : (
          <View style={{ gap: 16 }}>
            <ThemedText variant="headline">All caught up!</ThemedText>
            <ThemedText variant="body" color="muted">
              {cartCount > 0
                ? `You have ${cartCount} item${cartCount !== 1 ? "s" : ""} waiting in your cart.`
                : filteredListings.length === 0
                  ? "No listings match your current filters. Try broadening your preferences."
                  : "New listings will appear when suppliers add products."}
            </ThemedText>
            {cartCount > 0 && (
              <PressableScale
                accessibilityLabel="View cart"
                onPress={() => router.push("/matches")}
                style={[styles.emptyBtn, { backgroundColor: theme.colors.primary }]}
              >
                <ThemedText variant="label" color="onPrimary">View Cart →</ThemedText>
              </PressableScale>
            )}
            <PressableScale
              accessibilityLabel="Sign out"
              onPress={() => { clearSession(); router.replace("/sign-in"); }}
              style={[styles.emptyBtn, { borderWidth: 1, borderColor: theme.colors.border }]}
            >
              <ThemedText variant="label">Sign out</ThemedText>
            </PressableScale>
          </View>
        )}
      </View>

      {/* Action buttons */}
      {current ? (
        <View style={styles.actions}>
          <PressableScale
            accessibilityLabel="Pass on this listing"
            onPress={dismissLeft}
            style={[styles.actionBtn, styles.actionBtnNope, { borderColor: "#EF4444", backgroundColor: theme.colors.surface }]}
          >
            <ThemedText variant="headline" style={{ color: "#EF4444" }}>✕</ThemedText>
          </PressableScale>

          <PressableScale
            accessibilityLabel="Like — add to cart"
            onPress={handleLikeButton}
            style={[styles.actionBtn, styles.actionBtnLike, { backgroundColor: theme.colors.primary }]}
          >
            <ThemedText variant="headline" color="onPrimary">♥</ThemedText>
          </PressableScale>
        </View>
      ) : null}

      {/* Quantity sheet */}
      <QuantitySheet
        listing={sheetListing}
        qty={qty}
        onIncrement={() => setQty((q) => q + 1)}
        onDecrement={() => setQty((q) => Math.max(1, q - 1))}
        onConfirm={handleConfirm}
        onCancel={handleSkip}
      />

      {/* Filters modal */}
      <Modal visible={filtersOpen} transparent animationType="slide" onRequestClose={() => setFiltersOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, { backgroundColor: theme.colors.surface, borderTopLeftRadius: theme.radius.lg, borderTopRightRadius: theme.radius.lg }]}>
            <View style={styles.modalHeader}>
              <ThemedText variant="headline">Tune your feed</ThemedText>
              <PressableScale
                accessibilityLabel="Close filters"
                onPress={() => setFiltersOpen(false)}
                style={[styles.doneBtn, { borderColor: theme.colors.border }]}
              >
                <ThemedText variant="caption">Done</ThemedText>
              </PressableScale>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingBottom: 8 }}>
              <FilterRow label="Parent Category" options={parentCategories} selected={selectedParentCategories}
                onPress={(v) => toggleFilter(v, selectedParentCategories, setSelectedParentCategories)} />
              <FilterRow label="Price / Unit"
                options={PRICE_BUCKETS.map((b) => b.label)}
                selected={PRICE_BUCKETS.filter((b) => b.key === priceBucket).map((b) => b.label)}
                onPress={(label) => { const m = PRICE_BUCKETS.find((b) => b.label === label); if (m) setPriceBucket(m.key); }} />
              <FilterRow label="Sub Category" options={subCategories} selected={selectedSubCategories}
                onPress={(v) => toggleFilter(v, selectedSubCategories, setSelectedSubCategories)} />
              <FilterRow label="Attributes" options={attributes} selected={selectedAttributes}
                onPress={(v) => toggleFilter(v, selectedAttributes, setSelectedAttributes)} />
              <FilterRow label="Variants" options={variants} selected={selectedVariants}
                onPress={(v) => toggleFilter(v, selectedVariants, setSelectedVariants)} />
              <FilterRow label="Units" options={units} selected={selectedUnits}
                onPress={(v) => toggleFilter(v, selectedUnits, setSelectedUnits)} />
              <View style={{ flexDirection: "row", gap: 8 }}>
                <FilterChip label="Has variants" selected={hasVariantsOnly} onPress={() => setHasVariantsOnly((p) => !p)} />
                <FilterChip label="Clear all" selected={false} onPress={clearFilters} />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

/* ─── Filter sub-components ──────────────────────────────────── */

type FilterRowProps = { label: string; options: string[]; selected: string[]; onPress: (v: string) => void };
function FilterRow({ label, options, selected, onPress }: FilterRowProps) {
  if (options.length === 0) return null;
  return (
    <View style={{ gap: 6 }}>
      <ThemedText variant="caption" color="muted">{label}</ThemedText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {options.map((o) => (
          <FilterChip key={`${label}-${o}`} label={o} selected={selected.includes(o)} onPress={() => onPress(o)} />
        ))}
      </ScrollView>
    </View>
  );
}

type FilterChipProps = { label: string; selected: boolean; onPress: () => void };
function FilterChip({ label, selected, onPress }: FilterChipProps) {
  const theme = useTheme();
  return (
    <PressableScale
      accessibilityLabel={label}
      onPress={onPress}
      style={{
        paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1,
        borderColor:       selected ? theme.colors.primary : theme.colors.border,
        backgroundColor:   selected ? theme.colors.primary : theme.colors.surface,
      }}
    >
      <ThemedText variant="caption" color={selected ? "onPrimary" : "primary"}>{label}</ThemedText>
    </PressableScale>
  );
}

/* ─── Styles ──────────────────────────────────────────────────── */
const styles = StyleSheet.create({
  header:        { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  headerBtn:     { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, borderWidth: 1 },
  badge:         { minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 4, alignItems: "center", justifyContent: "center" },

  deckContainer: { flex: 1 },

  actions:       { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 52, paddingBottom: 12 },
  actionBtn:     { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center" },
  actionBtnNope: { borderWidth: 2.5 },
  actionBtnLike: { width: 72, height: 72, borderRadius: 36 },

  emptyBtn:      { alignSelf: "flex-start", paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14 },

  modalBackdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.42)" },
  modalSheet:    { maxHeight: "78%", paddingHorizontal: 18, paddingTop: 14, paddingBottom: 22, gap: 12 },
  modalHeader:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  doneBtn:       { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 1 },
});
