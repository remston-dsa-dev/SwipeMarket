import { Modal, Pressable, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { GlassSurface } from "@/components/GlassSurface";
import { PressableScale } from "@/components/PressableScale";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/theme/ThemeContext";
import type { Listing } from "@/types/listing";

type Props = {
  listing: Listing | null;
  qty: number;
  onIncrement: () => void;
  onDecrement: () => void;
  onConfirm: () => void;
  onCancel: () => void;
};

export function QuantitySheet({
  listing,
  qty,
  onIncrement,
  onDecrement,
  onConfirm,
  onCancel,
}: Props) {
  const theme = useTheme();

  return (
    <Modal
      visible={listing !== null}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />

        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.colors.surface,
              borderTopLeftRadius: theme.radius.lg,
              borderTopRightRadius: theme.radius.lg,
            },
          ]}
        >
          {/* Handle */}
          <View
            style={[styles.handle, { backgroundColor: theme.colors.border }]}
          />

          {listing && (
            <>
              {/* Product preview */}
              <GlassSurface
                style={{ flexDirection: "row", gap: 14, padding: 14 }}
              >
                <Image
                  source={{ uri: listing.imageUrl }}
                  style={{
                    width: 76,
                    height: 76,
                    borderRadius: theme.radius.sm,
                  }}
                  contentFit="cover"
                  accessibilityLabel={listing.title}
                />
                <View style={{ flex: 1, gap: 4, justifyContent: "center" }}>
                  <ThemedText variant="headline">{listing.title}</ThemedText>
                  <ThemedText variant="label" color="secondary">
                    {listing.priceLabel} each
                  </ThemedText>
                </View>
              </GlassSurface>

              {/* Qty row */}
              <View style={styles.qtyRow}>
                <PressableScale
                  accessibilityLabel="Decrease quantity"
                  onPress={() => {
                    if (qty > 1) onDecrement();
                  }}
                  style={[
                    styles.qtyBtn,
                    {
                      borderColor:
                        qty <= 1
                          ? theme.colors.border
                          : theme.colors.primary,
                      backgroundColor: theme.colors.surface,
                    },
                  ]}
                >
                  <ThemedText
                    variant="headline"
                    style={{
                      color:
                        qty <= 1
                          ? theme.colors.textSecondary
                          : theme.colors.primary,
                    }}
                  >
                    −
                  </ThemedText>
                </PressableScale>

                <ThemedText
                  variant="title"
                  style={{ minWidth: 48, textAlign: "center" }}
                >
                  {qty}
                </ThemedText>

                <PressableScale
                  accessibilityLabel="Increase quantity"
                  onPress={onIncrement}
                  style={[
                    styles.qtyBtn,
                    {
                      borderColor: theme.colors.primary,
                      backgroundColor: theme.colors.surface,
                    },
                  ]}
                >
                  <ThemedText
                    variant="headline"
                    style={{ color: theme.colors.primary }}
                  >
                    +
                  </ThemedText>
                </PressableScale>
              </View>

              {/* Subtotal hint */}
              <ThemedText
                variant="caption"
                color="muted"
                style={{ textAlign: "center" }}
              >
                Subtotal:{" "}
                {`$${((listing.unitPriceCents * qty) / 100).toFixed(2)}`}
              </ThemedText>

              {/* CTA */}
              <PressableScale
                accessibilityLabel="Add to cart"
                onPress={onConfirm}
                style={[
                  styles.ctaBtn,
                  { backgroundColor: theme.colors.primary, borderRadius: theme.radius.md },
                ]}
              >
                <ThemedText variant="label" color="onPrimary">
                  Add {qty} to Cart
                </ThemedText>
              </PressableScale>

              <PressableScale
                accessibilityLabel="Skip listing"
                onPress={onCancel}
                style={styles.skipBtn}
              >
                <ThemedText variant="caption" color="muted">
                  Skip this listing
                </ThemedText>
              </PressableScale>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheet: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 36,
    gap: 20,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 4,
  },
  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 28,
  },
  qtyBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  ctaBtn: {
    paddingVertical: 16,
    alignItems: "center",
  },
  skipBtn: {
    alignItems: "center",
    paddingVertical: 4,
  },
});
