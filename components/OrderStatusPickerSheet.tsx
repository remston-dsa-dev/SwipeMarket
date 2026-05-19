import { Modal, Pressable, StyleSheet, View } from "react-native";
import { PressableScale } from "@/components/PressableScale";
import { ThemedText } from "@/components/ThemedText";
import { ORDER_STATUSES, orderStatusLabel, type OrderStatus } from "@/lib/order-status";
import { useTheme } from "@/theme/ThemeContext";

type Props = {
  visible: boolean;
  title: string;
  subtitle?: string;
  currentStatus: OrderStatus;
  saving?: boolean;
  onSelect: (status: OrderStatus) => void;
  onClose: () => void;
};

export function OrderStatusPickerSheet({
  visible,
  title,
  subtitle,
  currentStatus,
  saving,
  onSelect,
  onClose,
}: Props) {
  const theme = useTheme();

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
            gap: 8,
          }}
        >
          <ThemedText variant="headline" style={{ marginBottom: subtitle ? 4 : 8 }}>
            {title}
          </ThemedText>
          {subtitle ? (
            <ThemedText variant="caption" color="muted" style={{ marginBottom: 8 }} numberOfLines={2}>
              {subtitle}
            </ThemedText>
          ) : null}
          {ORDER_STATUSES.map((s) => (
            <PressableScale
              key={s}
              accessibilityLabel={orderStatusLabel(s)}
              onPress={() => {
                if (saving) return;
                onSelect(s);
              }}
              style={{
                paddingVertical: 14,
                paddingHorizontal: 16,
                borderRadius: theme.radius.md,
                borderWidth: 1,
                borderColor: currentStatus === s ? theme.colors.primary : theme.colors.border,
                backgroundColor:
                  currentStatus === s
                    ? theme.scheme === "light"
                      ? "rgba(124,58,237,0.08)"
                      : "rgba(124,58,237,0.18)"
                    : theme.colors.background,
              }}
            >
              <ThemedText variant="label" color="primary">
                {orderStatusLabel(s)}
              </ThemedText>
            </PressableScale>
          ))}
          <PressableScale
            accessibilityLabel="Close"
            onPress={onClose}
            style={{ alignItems: "center", paddingVertical: 12 }}
          >
            <ThemedText variant="caption" color="muted">
              Cancel
            </ThemedText>
          </PressableScale>
        </View>
      </View>
    </Modal>
  );
}
