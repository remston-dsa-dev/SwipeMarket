import { useEffect, useState } from "react";
import { ActivityIndicator, Modal, Pressable, StyleSheet, TextInput, View } from "react-native";
import { Image } from "expo-image";
import { PressableScale } from "@/components/PressableScale";
import { ThemedText } from "@/components/ThemedText";
import { lineReturnableQty, RETURN_WARRANTY_DAYS, type OrderLineFields } from "@/lib/order-line";
import { useTheme } from "@/theme/ThemeContext";

export type ReturnRequestLine = OrderLineFields & {
  id: string;
  title: string;
  image_url: string;
  unit_price_cents: number;
};

type Props = {
  visible: boolean;
  line: ReturnRequestLine | null;
  saving?: boolean;
  onSubmit: (qty: number, reason: string) => void;
  onClose: () => void;
};

export function ReturnRequestSheet({ visible, line, saving, onSubmit, onClose }: Props) {
  const theme = useTheme();
  const maxQty = line ? lineReturnableQty(line) : 1;
  const [qty, setQty] = useState(1);
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!visible || !line) return;
    setQty(1);
    setReason("");
  }, [visible, line?.id]);

  if (!line) return null;

  const lineTotal = (line.unit_price_cents * qty) / 100;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: "flex-end" }}>
        <Pressable
          accessibilityLabel="Dismiss"
          style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(0,0,0,0.45)" }]}
          onPress={onClose}
        />
        <View
          style={{
            backgroundColor: theme.colors.surface,
            borderTopLeftRadius: theme.radius.lg,
            borderTopRightRadius: theme.radius.lg,
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 36,
            gap: 14,
          }}
        >
          <ThemedText variant="headline">Request return or refund</ThemedText>
          <ThemedText variant="caption" color="muted">
            Your partner will review within the {RETURN_WARRANTY_DAYS}-day return window. Refunds are
            issued after they resolve the request.
          </ThemedText>

          <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
            <Image
              source={{ uri: line.image_url }}
              style={{ width: 52, height: 52, borderRadius: theme.radius.sm }}
              contentFit="cover"
            />
            <View style={{ flex: 1, gap: 4 }}>
              <ThemedText variant="label" numberOfLines={2}>
                {line.title}
              </ThemedText>
              <ThemedText variant="caption" color="muted">
                Up to {maxQty} unit{maxQty === 1 ? "" : "s"} · ${lineTotal.toFixed(2)} line value
              </ThemedText>
            </View>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
            <ThemedText variant="label">Quantity</ThemedText>
            <PressableScale
              accessibilityLabel="Decrease quantity"
              onPress={() => setQty((q) => Math.max(1, q - 1))}
              style={qtyBtn(theme)}
            >
              <ThemedText variant="headline">−</ThemedText>
            </PressableScale>
            <ThemedText variant="headline" style={{ minWidth: 28, textAlign: "center" }}>
              {qty}
            </ThemedText>
            <PressableScale
              accessibilityLabel="Increase quantity"
              onPress={() => setQty((q) => Math.min(maxQty, q + 1))}
              style={qtyBtn(theme)}
            >
              <ThemedText variant="headline">+</ThemedText>
            </PressableScale>
          </View>

          <View style={{ gap: 6 }}>
            <ThemedText variant="label">Reason (optional)</ThemedText>
            <TextInput
              value={reason}
              onChangeText={setReason}
              placeholder="Wrong size, damaged, changed mind…"
              placeholderTextColor={theme.colors.textSecondary}
              multiline
              style={{
                minHeight: 72,
                borderRadius: theme.radius.md,
                borderWidth: 1,
                borderColor: theme.colors.border,
                padding: 12,
                color: theme.colors.textPrimary,
                backgroundColor: theme.colors.background,
                textAlignVertical: "top",
              }}
            />
          </View>

          <PressableScale
            accessibilityLabel="Submit return request"
            disabled={!!saving}
            onPress={() => onSubmit(qty, reason)}
            style={{
              paddingVertical: 14,
              borderRadius: theme.radius.md,
              backgroundColor: theme.colors.primary,
              alignItems: "center",
            }}
          >
            {saving ? (
              <ActivityIndicator color={theme.colors.textOnPrimary} />
            ) : (
              <ThemedText variant="label" color="onPrimary">
                Submit request
              </ThemedText>
            )}
          </PressableScale>

          <PressableScale accessibilityLabel="Cancel" onPress={onClose} style={{ alignItems: "center" }}>
            <ThemedText variant="caption" color="muted">
              Cancel
            </ThemedText>
          </PressableScale>
        </View>
      </View>
    </Modal>
  );
}

function qtyBtn(theme: ReturnType<typeof useTheme>) {
  return {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  };
}
