import { useState } from "react";
import { Alert, View } from "react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import { PressableScale } from "@/components/PressableScale";
import { ThemedText } from "@/components/ThemedText";
import { useSessionStore } from "@/stores/session-store";
import { useTheme } from "@/theme/ThemeContext";
import type { Product } from "@/types/product";
import { supabase } from "@/lib/supabase";

type Props = {
  product: Product;
};

function stockColor(stock: number): string {
  if (stock >= 10) return "#22C55E";
  if (stock >= 3) return "#F59E0B";
  return "#EF4444";
}

export function ProductRow({ product }: Props) {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const supplierId = useSessionStore((s) => s.userId);
  const qtyOnHold = product.qtyOnHold ?? 0;
  const qtyAllocated = product.qtyAllocated ?? 0;
  const qtyAvailable = Math.max(0, product.stock - qtyOnHold - qtyAllocated);
  const color = stockColor(product.stock);
  const [busy, setBusy] = useState(false);

  const invalidate = () => {
    if (supplierId) {
      void queryClient.invalidateQueries({ queryKey: ["supplier-products", supplierId] });
    }
    void queryClient.invalidateQueries({ queryKey: ["listings"] });
  };

  const adjustMutation = useMutation({
    mutationFn: async (delta: number) => {
      const next = Math.max(0, product.stock + delta);
      const { error } = await supabase
        .from("products")
        .update({
          stock: next,
          updated_at: new Date().toISOString(),
        })
        .eq("id", product.id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (e: Error) => Alert.alert("Update failed", e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("products").delete().eq("id", product.id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (e: Error) => {
      const msg = e.message.toLowerCase().includes("cart")
        ? "This SKU is still in a shopper cart. When the last cart line is removed, you can delete it."
        : e.message;
      Alert.alert("Delete failed", msg);
    },
  });

  function adjustStock(delta: number) {
    if (busy) return;
    const nextStock = product.stock + delta;
    if (delta < 0 && nextStock < qtyOnHold + qtyAllocated) return;
    setBusy(true);
    adjustMutation.mutate(delta, {
      onSettled: () => setBusy(false),
    });
  }

  function removeProduct() {
    Alert.alert(
      "Remove product?",
      `Remove "${product.title}" from your inventory?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            setBusy(true);
            deleteMutation.mutate(undefined, { onSettled: () => setBusy(false) });
          },
        },
      ],
    );
  }

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
      }}
    >
      <Image
        source={{ uri: product.imageUrl }}
        style={{ width: 56, height: 56, borderRadius: theme.radius.sm }}
        contentFit="cover"
        accessibilityLabel={product.title}
      />

      <View style={{ flex: 1, gap: 3 }}>
        <ThemedText variant="label" numberOfLines={1}>
          {product.title}
        </ThemedText>
        <ThemedText variant="caption" color="secondary">
          {product.priceLabel}
        </ThemedText>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: color,
            }}
          />
          <ThemedText variant="caption" style={{ color }}>
            Qty Available: {qtyAvailable}
          </ThemedText>
          <ThemedText variant="caption" color="muted">
            Qty On Hold: {qtyOnHold}
          </ThemedText>
          <ThemedText variant="caption" color="muted">
            Qty Allocated: {qtyAllocated}
          </ThemedText>
        </View>
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <PressableScale
          accessibilityLabel="Decrease stock"
          onPress={() => adjustStock(-1)}
          style={[
            stockBtnStyle,
            {
              borderColor:
                qtyAvailable === 0 ? theme.colors.border : theme.colors.primary,
            },
          ]}
        >
          <ThemedText
            variant="caption"
            style={{
              color:
                qtyAvailable === 0
                  ? theme.colors.textSecondary
                  : theme.colors.primary,
              fontWeight: "700",
            }}
          >
            −
          </ThemedText>
        </PressableScale>

        <ThemedText
          variant="caption"
          style={{ minWidth: 22, textAlign: "center", fontWeight: "700" }}
        >
          {qtyAvailable}
        </ThemedText>

        <PressableScale
          accessibilityLabel="Increase stock"
          onPress={() => adjustStock(1)}
          style={[stockBtnStyle, { borderColor: theme.colors.primary }]}
        >
          <ThemedText
            variant="caption"
            style={{ color: theme.colors.primary, fontWeight: "700" }}
          >
            +
          </ThemedText>
        </PressableScale>
      </View>

      <PressableScale
        accessibilityLabel={`Delete ${product.title}`}
        onPress={removeProduct}
        style={{
          paddingHorizontal: 10,
          paddingVertical: 6,
          borderRadius: theme.radius.sm,
          borderWidth: 1,
          borderColor: "#EF4444",
        }}
      >
        <ThemedText variant="caption" style={{ color: "#EF4444" }}>
          ✕
        </ThemedText>
      </PressableScale>
    </View>
  );
}

const stockBtnStyle = {
  width: 28,
  height: 28,
  borderRadius: 14,
  alignItems: "center" as const,
  justifyContent: "center" as const,
  borderWidth: 1,
};
