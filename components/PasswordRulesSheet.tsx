import { useMemo } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PressableScale } from "@/components/PressableScale";
import { ThemedText } from "@/components/ThemedText";
import {
  STATUS_SUCCESS,
  TIER_BEST,
  TIER_DANGER,
  TIER_FAIR,
  TIER_STRONG,
  TIER_WEAK,
} from "@/lib/status-colors";
import { getPasswordChecks, type PasswordCheck } from "@/lib/validation";
import { useTheme } from "@/theme/ThemeContext";

type StrengthTier = { label: string; color: string; segments: number };

function tierFor(score: number): StrengthTier {
  if (score <= 1) return { label: "Too weak",  color: TIER_DANGER, segments: 1 };
  if (score === 2) return { label: "Weak",     color: TIER_WEAK,   segments: 2 };
  if (score === 3) return { label: "Fair",     color: TIER_FAIR,   segments: 3 };
  if (score === 4) return { label: "Strong",   color: TIER_STRONG, segments: 4 };
  return { label: "Excellent", color: TIER_BEST, segments: 5 };
}

type Props = {
  visible: boolean;
  password: string;
  onClose: () => void;
};

export function PasswordRulesSheet({ visible, password, onClose }: Props) {
  const theme = useTheme();
  const checks = useMemo(() => getPasswordChecks(password), [password]);
  const score  = checks.filter((c) => c.passed).length;
  const tier   = tierFor(score);
  const showTier = password.length > 0;

  const trackBg = theme.scheme === "dark" ? "rgba(255,255,255,0.08)" : "#E5E7EB";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

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
          <View style={[styles.handle, { backgroundColor: theme.colors.border }]} />

          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <ThemedText variant="headline">Password requirements</ThemedText>
              <ThemedText variant="caption" color="muted">
                Choose a password that includes all of the following.
              </ThemedText>
            </View>
            <PressableScale accessibilityLabel="Close" onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={theme.colors.textPrimary} />
            </PressableScale>
          </View>

          {/* Strength meter */}
          <View style={styles.meterRow}>
            <View style={styles.meterSegments}>
              {[0, 1, 2, 3, 4].map((i) => {
                const filled = i < tier.segments && showTier;
                return (
                  <View
                    key={i}
                    style={[
                      styles.meterSegment,
                      { backgroundColor: filled ? tier.color : trackBg },
                    ]}
                  />
                );
              })}
            </View>
            <ThemedText
              variant="caption"
              style={{
                color: showTier ? tier.color : theme.colors.textSecondary,
                fontWeight: "700",
                minWidth: 72,
                textAlign: "right",
              }}
            >
              {showTier ? tier.label : "Start typing"}
            </ThemedText>
          </View>

          {/* Rule list */}
          <View style={styles.ruleList}>
            {checks.map((check) => (
              <RuleRow
                key={check.id}
                check={check}
                pendingColor={theme.colors.textSecondary}
                textColor={theme.colors.textPrimary}
              />
            ))}
          </View>

          <PressableScale
            accessibilityLabel="Got it"
            onPress={onClose}
            style={[
              styles.ctaBtn,
              {
                backgroundColor: theme.colors.primary,
                borderRadius: theme.radius.md,
              },
            ]}
          >
            <ThemedText variant="label" color="onPrimary">
              Got it
            </ThemedText>
          </PressableScale>
        </View>
      </View>
    </Modal>
  );
}

function RuleRow({
  check,
  pendingColor,
  textColor,
}: {
  check: PasswordCheck;
  pendingColor: string;
  textColor: string;
}) {
  /* Passed rows: small filled badge on a subtle tinted bg.
     Pending rows: outline dot + secondary text.
     Avoids the "green soup" of bright-green icon + bright-green text. */
  return (
    <View style={styles.ruleRow}>
      <View
        style={[
          styles.ruleDot,
          check.passed
            ? { backgroundColor: STATUS_SUCCESS }
            : {
                backgroundColor: "transparent",
                borderWidth: 1.5,
                borderColor: pendingColor,
              },
        ]}
      >
        {check.passed ? (
          <Ionicons name="checkmark-sharp" size={11} color="#FFFFFF" />
        ) : null}
      </View>
      <ThemedText
        variant="body"
        style={{
          color: check.passed ? textColor : pendingColor,
          fontWeight: "500",
        }}
      >
        {check.label}
      </ThemedText>
    </View>
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
    gap: 18,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 4,
  },
  headerRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  meterRow:       { flexDirection: "row", alignItems: "center", gap: 12 },
  meterSegments:  { flex: 1, flexDirection: "row", gap: 4 },
  meterSegment:   { flex: 1, height: 5, borderRadius: 999 },
  ruleList:       { gap: 10, marginTop: 4 },
  ruleRow:        { flexDirection: "row", alignItems: "center", gap: 12 },
  ruleDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaBtn:         { paddingVertical: 14, alignItems: "center", marginTop: 4 },
});
