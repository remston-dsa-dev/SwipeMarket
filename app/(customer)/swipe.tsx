import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Dimensions, ScrollView, View } from "react-native";
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
import { useInventoryStore } from "@/stores/inventory-store";
import { useSessionStore } from "@/stores/session-store";
import { useTheme } from "@/theme/ThemeContext";
import type { Listing } from "@/types/listing";

const { width } = Dimensions.get("window");
const PRICE_BUCKETS = [
  { key: "all", label: "Any price", min: 0, max: Number.POSITIVE_INFINITY },
  { key: "budget", label: "Under $50", min: 0, max: 5000 },
  { key: "mid", label: "$50 - $150", min: 5000, max: 15000 },
  { key: "premium", label: "$150+", min: 15000, max: Number.POSITIVE_INFINITY },
] as const;

export default function SwipeScreen() {
  const router = useRouter();
  const theme = useTheme();
  const clearSession = useSessionStore((s) => s.clearSession);
  const { data: listings } = useListings();
  const products = useInventoryStore((s) => s.products);
  const addItem = useCartStore((s) => s.addItem);
  const cartItems = useCartStore((s) => s.items);

  const [index, setIndex] = useState(0);
  const [sheetListing, setSheetListing] = useState<Listing | null>(null);
  const [qty, setQty] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedParentCategories, setSelectedParentCategories] = useState<string[]>([]);
  const [selectedSubCategories, setSelectedSubCategories] = useState<string[]>([]);
  const [selectedAttributes, setSelectedAttributes] = useState<string[]>([]);
  const [selectedVariants, setSelectedVariants] = useState<string[]>([]);
  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);
  const [priceBucket, setPriceBucket] = useState<(typeof PRICE_BUCKETS)[number]["key"]>("all");
  const [hasVariantsOnly, setHasVariantsOnly] = useState(false);

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

  const activePrice = PRICE_BUCKETS.find((bucket) => bucket.key === priceBucket) ?? PRICE_BUCKETS[0];

  const filteredListings = useMemo(
    () =>
      listings.filter((listing) => {
        if (hasVariantsOnly && (listing.variants?.length ?? 0) === 0) {
          return false;
        }
        const listingParentCategory = listing.parentCategory ?? listing.category;
        if (
          selectedParentCategories.length > 0 &&
          (!listingParentCategory || !selectedParentCategories.includes(listingParentCategory))
        ) {
          return false;
        }
        if (
          selectedSubCategories.length > 0 &&
          (!listing.subCategory || !selectedSubCategories.includes(listing.subCategory))
        ) {
          return false;
        }
        if (
          selectedAttributes.length > 0 &&
          !selectedAttributes.every((value) => (listing.attributes ?? []).includes(value))
        ) {
          return false;
        }
        if (
          selectedVariants.length > 0 &&
          !selectedVariants.some((value) => (listing.variants ?? []).includes(value))
        ) {
          return false;
        }
        if (selectedUnits.length > 0 && (!listing.unit || !selectedUnits.includes(listing.unit))) {
          return false;
        }
        return listing.unitPriceCents >= activePrice.min && listing.unitPriceCents <= activePrice.max;
      }),
    [
      activePrice.max,
      activePrice.min,
      hasVariantsOnly,
      listings,
      selectedAttributes,
      selectedParentCategories,
      selectedSubCategories,
      selectedUnits,
      selectedVariants,
    ],
  );

  // Refs for stable worklet access
  const listingsRef = useRef<Listing[]>([]);
  const indexRef = useRef(0);
  useEffect(() => { listingsRef.current = filteredListings; }, [filteredListings]);
  useEffect(() => { indexRef.current = index; }, [index]);

  const translateX = useSharedValue(0);
  const rotateZ = useSharedValue(0);

  useEffect(() => {
    setIndex(0);
    translateX.value = 0;
    rotateZ.value = 0;
  }, [filteredListings, rotateZ, translateX]);

  const current = filteredListings[index];
  const next = filteredListings[index + 1];
  const afterNext = filteredListings[index + 2];

  const cartCount = cartItems.reduce((sum, i) => sum + i.qty, 0);
  const activeFiltersCount =
    selectedParentCategories.length +
    selectedSubCategories.length +
    selectedAttributes.length +
    selectedVariants.length +
    selectedUnits.length +
    (priceBucket === "all" ? 0 : 1) +
    (hasVariantsOnly ? 1 : 0);

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

  function toggleFilter(value: string, selected: string[], setter: (next: string[]) => void) {
    if (selected.includes(value)) {
      setter(selected.filter((item) => item !== value));
      return;
    }
    setter([...selected, value]);
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
              {filteredListings.length - index} listing
              {filteredListings.length - index !== 1 ? "s" : ""} left
            </ThemedText>
          ) : null}
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <PressableScale
            accessibilityLabel="Open discover filters"
            onPress={() => setFiltersOpen((prev) => !prev)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: theme.radius.pill,
              borderWidth: 1,
              borderColor: theme.colors.glassBorder,
              backgroundColor: theme.colors.overlay,
            }}
          >
            <ThemedText variant="caption">Filters</ThemedText>
            {activeFiltersCount > 0 && (
              <View
                style={{
                  minWidth: 18,
                  height: 18,
                  borderRadius: 9,
                  paddingHorizontal: 4,
                  backgroundColor: theme.colors.primary,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ThemedText variant="caption" color="onPrimary" style={{ fontSize: 10, lineHeight: 12 }}>
                  {activeFiltersCount}
                </ThemedText>
              </View>
            )}
          </PressableScale>

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
      </View>

      <View style={{ gap: 10, marginBottom: 14 }}>
        <FilterRow
          label="Parent Category"
          options={parentCategories}
          selected={selectedParentCategories}
          onPress={(value) => toggleFilter(value, selectedParentCategories, setSelectedParentCategories)}
        />
        <FilterRow
          label="Price / Unit"
          options={PRICE_BUCKETS.map((bucket) => bucket.label)}
          selected={PRICE_BUCKETS.filter((bucket) => bucket.key === priceBucket).map((bucket) => bucket.label)}
          onPress={(label) => {
            const matched = PRICE_BUCKETS.find((bucket) => bucket.label === label);
            if (matched) setPriceBucket(matched.key);
          }}
        />
      </View>

      {filtersOpen ? (
        <View style={{ gap: 10, marginBottom: 14 }}>
          <FilterRow
            label="Sub Category"
            options={subCategories}
            selected={selectedSubCategories}
            onPress={(value) => toggleFilter(value, selectedSubCategories, setSelectedSubCategories)}
          />
          <FilterRow
            label="Attributes"
            options={attributes}
            selected={selectedAttributes}
            onPress={(value) => toggleFilter(value, selectedAttributes, setSelectedAttributes)}
          />
          <FilterRow
            label="Variants"
            options={variants}
            selected={selectedVariants}
            onPress={(value) => toggleFilter(value, selectedVariants, setSelectedVariants)}
          />
          <FilterRow
            label="Units"
            options={units}
            selected={selectedUnits}
            onPress={(value) => toggleFilter(value, selectedUnits, setSelectedUnits)}
          />
          <View style={{ flexDirection: "row", gap: 8 }}>
            <FilterChip
              label="Has variants"
              selected={hasVariantsOnly}
              onPress={() => setHasVariantsOnly((prev) => !prev)}
            />
            <FilterChip label="Clear all" selected={false} onPress={clearFilters} />
          </View>
        </View>
      ) : null}

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
                : filteredListings.length === 0
                  ? "No listings match your current filters. Try broadening your preferences."
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

type FilterRowProps = {
  label: string;
  options: string[];
  selected: string[];
  onPress: (value: string) => void;
};

function FilterRow({ label, options, selected, onPress }: FilterRowProps) {
  if (options.length === 0) return null;
  return (
    <View style={{ gap: 6 }}>
      <ThemedText variant="caption" color="muted">
        {label}
      </ThemedText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {options.map((option) => (
          <FilterChip
            key={`${label}-${option}`}
            label={option}
            selected={selected.includes(option)}
            onPress={() => onPress(option)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

type FilterChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

function FilterChip({ label, selected, onPress }: FilterChipProps) {
  const theme = useTheme();
  return (
    <PressableScale
      accessibilityLabel={label}
      onPress={onPress}
      style={{
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: selected ? theme.colors.primary : theme.colors.border,
        backgroundColor: selected ? theme.colors.primary : theme.colors.surface,
      }}
    >
      <ThemedText variant="caption" color={selected ? "onPrimary" : "primary"}>
        {label}
      </ThemedText>
    </PressableScale>
  );
}
