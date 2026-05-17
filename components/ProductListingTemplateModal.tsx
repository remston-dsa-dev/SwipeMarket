import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { PressableScale } from "@/components/PressableScale";
import { ThemedText } from "@/components/ThemedText";
import {
  PRODUCT_LISTING_TEMPLATE_FIELDS,
  type ProductListingFieldSpec,
} from "@/lib/supplier-bulk-template-spec";
import { useTheme } from "@/theme/ThemeContext";

type Props = {
  visible: boolean;
  onClose: () => void;
};

function FieldRow({ row, theme }: { row: ProductListingFieldSpec; theme: ReturnType<typeof useTheme> }) {
  return (
    <View
      style={{
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: theme.colors.border,
        paddingVertical: 12,
        gap: 6,
      }}
    >
      <ThemedText variant="label" color="primary">
        {row.field}
      </ThemedText>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
        <View style={{ minWidth: 100 }}>
          <ThemedText variant="caption" color="muted">
            Mandatory
          </ThemedText>
          <ThemedText variant="caption">{row.mandatory ? "Yes" : "No"}</ThemedText>
        </View>
        <View style={{ minWidth: 100 }}>
          <ThemedText variant="caption" color="muted">
            Optional
          </ThemedText>
          <ThemedText variant="caption">{row.optional ? "Yes" : "No"}</ThemedText>
        </View>
        <View style={{ minWidth: 120, flex: 1 }}>
          <ThemedText variant="caption" color="muted">
            Datatype
          </ThemedText>
          <ThemedText variant="caption">{row.datatype}</ThemedText>
        </View>
      </View>
      <ThemedText variant="caption" color="muted" style={{ lineHeight: 18 }}>
        {row.notes}
      </ThemedText>
    </View>
  );
}

/** Explains each column in the bulk `.csv` / `.xlsx` for partners. */
export function ProductListingTemplateModal({ visible, onClose }: Props) {
  const theme = useTheme();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1 }}>
        <Pressable
          accessibilityLabel="Dismiss template reference"
          style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(0,0,0,0.45)" }]}
          onPress={onClose}
        />
        <View style={{ flex: 1, justifyContent: "flex-end" }} pointerEvents="box-none">
          <View
            style={{
              maxHeight: "88%",
              backgroundColor: theme.colors.surface,
              borderTopLeftRadius: theme.radius.lg,
              borderTopRightRadius: theme.radius.lg,
              paddingHorizontal: 18,
              paddingTop: 12,
              paddingBottom: 28,
            }}
          >
          <View style={{ alignItems: "center", marginBottom: 10 }}>
            <View
              style={{
                width: 40,
                height: 4,
                borderRadius: 2,
                backgroundColor: theme.colors.border,
              }}
            />
          </View>

          <ThemedText variant="headline" style={{ marginBottom: 4 }}>
            Review Product Listing Template
          </ThemedText>
          <ThemedText variant="caption" color="muted" style={{ marginBottom: 14, lineHeight: 20 }}>
            Use these exact column headers in row 1 of your .csv or .xlsx. Each row after that is one
            product. Required cells must be filled before import.
          </ThemedText>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 16 }}
            keyboardShouldPersistTaps="handled"
          >
            {PRODUCT_LISTING_TEMPLATE_FIELDS.map((row) => (
              <FieldRow key={row.field} row={row} theme={theme} />
            ))}
          </ScrollView>

          <PressableScale
            accessibilityLabel="Close template reference"
            onPress={onClose}
            style={{
              marginTop: 8,
              alignItems: "center",
              paddingVertical: 14,
              borderRadius: theme.radius.md,
              backgroundColor: theme.colors.primary,
            }}
          >
            <ThemedText variant="label" color="onPrimary">
              Done
            </ThemedText>
          </PressableScale>
          </View>
        </View>
      </View>
    </Modal>
  );
}
