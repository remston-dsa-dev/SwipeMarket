import { useState } from "react";
import {
  LayoutAnimation,
  Platform,
  StyleSheet,
  UIManager,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PressableScale } from "@/components/PressableScale";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/theme/ThemeContext";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Props = {
  /** Expanded on first render when inventory is empty; collapsed when listings exist. */
  defaultExpanded?: boolean;
  onDownloadTemplateCsv: () => void;
  onDownloadTemplateXlsx: () => void;
  onReviewTemplate: () => void;
};

/**
 * Collapsible template helpers (.csv, .xlsx, column reference) for partner bulk inventory.
 */
export function SupplierInventoryTemplateGroup({
  defaultExpanded = false,
  onDownloadTemplateCsv,
  onDownloadTemplateXlsx,
  onReviewTemplate,
}: Props) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(defaultExpanded);
  const isDark = theme.scheme === "dark";

  const chipBg = isDark ? theme.colors.surface : "#FFFFFF";
  const chipBorder = theme.colors.border;

  function toggleExpanded() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((open) => !open);
  }

  return (
    <View
      style={[
        styles.card,
        {
          borderRadius: theme.radius.lg,
          borderColor: expanded ? theme.colors.primary : theme.colors.border,
          backgroundColor: theme.colors.surface,
          shadowColor: isDark ? "#000" : theme.colors.primary,
          shadowOpacity: isDark ? 0.2 : 0.06,
        },
      ]}
    >
      <PressableScale
        accessibilityLabel={
          expanded ? "Collapse product template options" : "Expand product template options"
        }
        accessibilityState={{ expanded }}
        onPress={toggleExpanded}
        style={[
          styles.header,
          expanded && {
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        <View
          style={[
            styles.headerIcon,
            {
              backgroundColor: isDark ? "rgba(124,58,237,0.22)" : "rgba(124,58,237,0.1)",
            },
          ]}
        >
          <Ionicons name="documents-outline" size={20} color={theme.colors.primary} />
        </View>

        <View style={styles.headerCopy}>
          <ThemedText variant="label" color="primary">
            Product template
          </ThemedText>
          <ThemedText variant="caption" color="muted" numberOfLines={2}>
            Spreadsheet formats & column reference
          </ThemedText>
        </View>

        <View
          style={[
            styles.chevronWrap,
            {
              backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.05)",
            },
          ]}
        >
          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={16}
            color={theme.colors.textSecondary}
          />
        </View>
      </PressableScale>

      {expanded ? (
        <View
          style={[
            styles.body,
            { backgroundColor: isDark ? "rgba(0,0,0,0.15)" : theme.colors.background },
          ]}
        >
          <View style={styles.row}>
            <View
              style={[
                styles.rowIcon,
                {
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.surface,
                },
              ]}
            >
              <Ionicons name="download-outline" size={18} color={theme.colors.primary} />
            </View>
            <View style={styles.rowCopy}>
              <ThemedText variant="label" color="primary">
                Download template
              </ThemedText>
              <ThemedText variant="caption" color="muted">
                Choose spreadsheet format (.csv, .xlsx)
              </ThemedText>
            </View>
            <View style={styles.formatChips}>
              <PressableScale
                accessibilityLabel="Download product listing template as CSV"
                onPress={onDownloadTemplateCsv}
                style={[
                  styles.formatChip,
                  { borderColor: chipBorder, backgroundColor: chipBg },
                ]}
              >
                <ThemedText variant="caption" color="primary" style={styles.formatChipText}>
                  .csv
                </ThemedText>
              </PressableScale>
              <PressableScale
                accessibilityLabel="Download product listing template as Excel"
                onPress={onDownloadTemplateXlsx}
                style={[
                  styles.formatChip,
                  { borderColor: chipBorder, backgroundColor: chipBg },
                ]}
              >
                <ThemedText variant="caption" color="primary" style={styles.formatChipText}>
                  .xlsx
                </ThemedText>
              </PressableScale>
            </View>
          </View>

          <View
            style={[
              styles.divider,
              { backgroundColor: theme.colors.border, marginLeft: 56 },
            ]}
          />

          <PressableScale
            accessibilityLabel="Review product listing template columns"
            onPress={onReviewTemplate}
            style={styles.row}
          >
            <View
              style={[
                styles.rowIcon,
                {
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.surface,
                },
              ]}
            >
              <Ionicons name="list-outline" size={18} color={theme.colors.primary} />
            </View>
            <View style={styles.rowCopy}>
              <ThemedText variant="label" color="primary">
                Review product template
              </ThemedText>
              <ThemedText variant="caption" color="muted">
                Column headers & field rules
              </ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.textSecondary} />
          </PressableScale>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    borderWidth: 1,
    overflow: "hidden",
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  chevronWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    paddingVertical: 4,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  rowCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  formatChips: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
  },
  formatChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    minWidth: 52,
    alignItems: "center",
  },
  formatChipText: {
    fontSize: 13,
    letterSpacing: 0.2,
  },
});
