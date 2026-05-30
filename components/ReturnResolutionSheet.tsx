import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PressableScale } from "@/components/PressableScale";
import { ReturnPaymentDispositionLabels } from "@/components/return-resolution/ReturnPaymentDispositionLabels";
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
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const lineTotalCents = qty * unitPriceCents;
  const [selected, setSelected] = useState<Exclude<ReturnResolution, "pending"> | null>(null);
  const [partialDollars, setPartialDollars] = useState("");
  const [note, setNote] = useState("");
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const partialSectionY = useRef(0);
  const focusedFieldRef = useRef<"partial" | "note" | null>(null);

  useEffect(() => {
    if (!visible) {
      setSelected(null);
      setPartialDollars("");
      setNote("");
      setKeyboardHeight(0);
      Keyboard.dismiss();
      return;
    }

    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [visible]);

  const needsPartialAmount = useMemo(() => {
    if (!selected) return false;
    const opt = SUPPLIER_RETURN_RESOLUTIONS.find((r) => r.value === selected);
    return opt?.refundKind === "partial";
  }, [selected]);

  const keyboardOpen = keyboardHeight > 0;
  const sheetBottomPad = keyboardOpen ? 12 : Math.max(insets.bottom, 12);
  const footerBlockHeight = 12 + 48 + 1;
  const sheetMaxHeight =
    windowHeight * (keyboardOpen ? 1 : 0.88) - keyboardHeight - sheetBottomPad;
  const scrollMaxHeight = Math.max(120, sheetMaxHeight - footerBlockHeight);

  const scrollFieldIntoView = useCallback((field: "partial" | "note") => {
    focusedFieldRef.current = field;
    const runScroll = () => {
      if (field === "note") {
        scrollRef.current?.scrollToEnd({ animated: true });
        return;
      }
      scrollRef.current?.scrollTo({
        y: Math.max(0, partialSectionY.current - 8),
        animated: true,
      });
    };
    if (keyboardHeight > 0) {
      runScroll();
      return;
    }
    const delay = Platform.OS === "ios" ? 280 : 120;
    setTimeout(runScroll, delay);
  }, [keyboardHeight]);

  useEffect(() => {
    if (keyboardHeight <= 0 || !focusedFieldRef.current) return;
    const delay = Platform.OS === "ios" ? 60 : 0;
    const id = setTimeout(() => {
      const field = focusedFieldRef.current;
      if (!field) return;
      if (field === "note") {
        scrollRef.current?.scrollToEnd({ animated: true });
      } else {
        scrollRef.current?.scrollTo({
          y: Math.max(0, partialSectionY.current - 8),
          animated: true,
        });
      }
    }, delay);
    return () => clearTimeout(id);
  }, [keyboardHeight]);

  function handleDismiss() {
    Keyboard.dismiss();
    onClose();
  }

  function handleSubmit() {
    if (!selected || saving) return;
    let refundCents = 0;
    if (needsPartialAmount) {
      const parsed = Number.parseFloat(partialDollars.replace(/,/g, ""));
      if (!Number.isFinite(parsed) || parsed <= 0) return;
      refundCents = Math.round(parsed * 100);
    }
    Keyboard.dismiss();
    onResolve(selected, refundCents, note);
  }

  const inputStyle = {
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 12,
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.background,
    fontSize: theme.typography.body.fontSize,
    lineHeight: theme.typography.body.lineHeight,
  } as const;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleDismiss}>
      <View style={styles.flex}>
        <Pressable
          accessibilityLabel="Dismiss"
          style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(0,0,0,0.45)" }]}
          onPress={handleDismiss}
        />
        <View
          style={{
            backgroundColor: theme.colors.surface,
            borderTopLeftRadius: theme.radius.lg,
            borderTopRightRadius: theme.radius.lg,
            maxHeight: sheetMaxHeight + footerBlockHeight + sheetBottomPad,
            marginBottom: keyboardHeight,
            paddingBottom: sheetBottomPad,
          }}
        >
          <ScrollView
            ref={scrollRef}
            style={{ maxHeight: scrollMaxHeight }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
            bounces={false}
            contentContainerStyle={[
              styles.scrollContent,
              keyboardOpen ? styles.scrollContentKeyboard : null,
            ]}
          >
            <ThemedText variant="headline">Resolve return</ThemedText>
            <ThemedText variant="caption" color="muted" numberOfLines={2}>
              {productTitle} · {qty} unit{qty === 1 ? "" : "s"} · line $
              {(lineTotalCents / 100).toFixed(2)}
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
                  onPress={() => {
                    Keyboard.dismiss();
                    setSelected(opt.value);
                  }}
                  style={{
                    paddingVertical: 12,
                    paddingHorizontal: 14,
                    borderRadius: theme.radius.md,
                    borderWidth: 1,
                    borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                    backgroundColor: isSelected
                      ? theme.scheme === "light"
                        ? "rgba(124,58,237,0.06)"
                        : "rgba(124,58,237,0.14)"
                      : theme.colors.background,
                    gap: 8,
                  }}
                >
                  <View style={{ alignSelf: "stretch", width: "100%", gap: 6 }}>
                    <ReturnPaymentDispositionLabels
                      returnAccepted={opt.returnAccepted}
                      refundKind={opt.refundKind}
                      lineTotalCents={lineTotalCents}
                    />
                    <ThemedText variant="caption" color="muted" style={{ lineHeight: 18 }}>
                      {opt.description}
                    </ThemedText>
                  </View>
                </PressableScale>
              );
            })}

            {needsPartialAmount ? (
              <View
                style={{ gap: 6 }}
                onLayout={(e) => {
                  partialSectionY.current = e.nativeEvent.layout.y;
                }}
              >
                <ThemedText variant="label">Refund amount (USD)</ThemedText>
                <TextInput
                  value={partialDollars}
                  onChangeText={setPartialDollars}
                  onFocus={() => scrollFieldIntoView("partial")}
                  keyboardType="decimal-pad"
                  placeholder={`Max ${(lineTotalCents / 100).toFixed(2)}`}
                  placeholderTextColor={theme.colors.textSecondary}
                  style={inputStyle}
                />
              </View>
            ) : null}

            <View style={{ gap: 6 }}>
              <ThemedText variant="label">Note to shopper (optional)</ThemedText>
              <TextInput
                value={note}
                onChangeText={setNote}
                onFocus={() => scrollFieldIntoView("note")}
                placeholder="Explain your decision…"
                placeholderTextColor={theme.colors.textSecondary}
                multiline
                style={{
                  ...inputStyle,
                  minHeight: 72,
                  textAlignVertical: "top",
                }}
              />
            </View>
          </ScrollView>

          <View style={[styles.footer, { borderTopColor: theme.colors.border }]}>
            <PressableScale
              accessibilityLabel="Confirm resolution"
              disabled={!selected || !!saving}
              onPress={handleSubmit}
              style={{
                flex: 1,
                paddingVertical: 14,
                borderRadius: theme.radius.md,
                backgroundColor: selected ? theme.colors.primary : theme.colors.border,
                alignItems: "center",
                justifyContent: "center",
                minHeight: 48,
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

            <PressableScale
              accessibilityLabel="Cancel"
              onPress={handleDismiss}
              style={{
                flex: 1,
                paddingVertical: 14,
                borderRadius: theme.radius.md,
                borderWidth: 1,
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.background,
                alignItems: "center",
                justifyContent: "center",
                minHeight: 48,
              }}
            >
              <ThemedText variant="label" color="secondary">
                Cancel
              </ThemedText>
            </PressableScale>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, justifyContent: "flex-end" },
  scrollContent: {
    flexGrow: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 0,
    gap: 10,
  },
  scrollContentKeyboard: {
    paddingBottom: 16,
  },
  footer: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 10,
    borderTopWidth: 1,
  },
});
