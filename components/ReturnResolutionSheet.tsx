import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { PressableScale } from "@/components/PressableScale";
import { ThemedText } from "@/components/ThemedText";
import {
  SUPPLIER_RETURN_RESOLUTIONS,
  type ReturnResolution,
} from "@/lib/return-resolution";
import { useTheme } from "@/theme/ThemeContext";

type Props = {
  visible: boolean;
  productTitle: string;
  qty: number;
  unitPriceCents: number;
  reason: string | null;
  saving?: boolean;
  onResolve: (resolution: Exclude<ReturnResolution, "pending">, refundCents: number, note: string) => void;
  onClose: () => void;
};

export function ReturnResolutionSheet({
  visible,
  productTitle,
  qty,
  unitPriceCents,
  reason,
  saving,
  onResolve,
  onClose,
}: Props) {
  const theme = useTheme();
  const lineTotalCents = qty * unitPriceCents;
  const [selected, setSelected] = useState<Exclude<ReturnResolution, "pending"> | null>(null);
  const [partialDollars, setPartialDollars] = useState("");
  const [note, setNote] = useState("");

  const needsPartialAmount = useMemo(() => {
    if (!selected) return false;
    const opt = SUPPLIER_RETURN_RESOLUTIONS.find((r) => r.value === selected);
    return opt?.refundKind === "partial";
  }, [selected]);

  function handleSubmit() {
    if (!selected || saving) return;
    let refundCents = 0;
    if (needsPartialAmount) {
      const parsed = Number.parseFloat(partialDollars.replace(/,/g, ""));
      if (!Number.isFinite(parsed) || parsed <= 0) return;
      refundCents = Math.round(parsed * 100);
    }
    onResolve(selected, refundCents, note);
  }

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
            gap: 10,
            maxHeight: "88%",
          }}
        >
          <ThemedText variant="headline">Resolve return</ThemedText>
          <ThemedText variant="caption" color="muted" numberOfLines={2}>
            {productTitle} · {qty} unit{qty === 1 ? "" : "s"} · line ${(lineTotalCents / 100).toFixed(2)}
          </ThemedText>
          {reason ? (
            <ThemedText variant="caption" color="secondary">
              Shopper reason: {reason}
            </ThemedText>
          ) : null}

          {SUPPLIER_RETURN_RESOLUTIONS.map((opt) => {
            const isSelected = selected === opt.value;
            return (
              <PressableScale
                key={opt.value}
                accessibilityLabel={opt.label}
                onPress={() => setSelected(opt.value)}
                style={{
                  paddingVertical: 12,
                  paddingHorizontal: 14,
                  borderRadius: theme.radius.md,
                  borderWidth: 1,
                  borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                  backgroundColor: isSelected ? theme.colors.overlay : theme.colors.background,
                  gap: 4,
                }}
              >
                <ThemedText variant="label" style={{ fontWeight: isSelected ? "700" : "500" }}>
                  {opt.label}
                </ThemedText>
                <ThemedText variant="caption" color="muted">
                  {opt.description}
                </ThemedText>
              </PressableScale>
            );
          })}

          {needsPartialAmount ? (
            <View style={{ gap: 6 }}>
              <ThemedText variant="label">Refund amount (USD)</ThemedText>
              <TextInput
                value={partialDollars}
                onChangeText={setPartialDollars}
                keyboardType="decimal-pad"
                placeholder={`Max ${(lineTotalCents / 100).toFixed(2)}`}
                placeholderTextColor={theme.colors.textSecondary}
                style={{
                  borderRadius: theme.radius.md,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  padding: 12,
                  color: theme.colors.textPrimary,
                  backgroundColor: theme.colors.background,
                }}
              />
            </View>
          ) : null}

          <View style={{ gap: 6 }}>
            <ThemedText variant="label">Note to shopper (optional)</ThemedText>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Explain your decision…"
              placeholderTextColor={theme.colors.textSecondary}
              multiline
              style={{
                minHeight: 56,
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
            accessibilityLabel="Confirm resolution"
            disabled={!selected || !!saving}
            onPress={handleSubmit}
            style={{
              paddingVertical: 14,
              borderRadius: theme.radius.md,
              backgroundColor: selected ? theme.colors.primary : theme.colors.border,
              alignItems: "center",
              marginTop: 4,
            }}
          >
            {saving ? (
              <ActivityIndicator color={theme.colors.textOnPrimary} />
            ) : (
              <ThemedText variant="label" color={selected ? "onPrimary" : "muted"}>
                Confirm
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
