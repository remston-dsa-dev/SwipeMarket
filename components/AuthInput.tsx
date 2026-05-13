import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import {
  STATUS_ERROR,
  STATUS_SUCCESS,
  STATUS_WARNING,
} from "@/lib/status-colors";
import { useTheme } from "@/theme/ThemeContext";

type Props = TextInputProps & {
  icon: keyof typeof Ionicons.glyphMap;
  isPassword?: boolean;
  error?: string;
  /** Optional explicit label drawn above the input (Airbnb-style hierarchy). */
  label?: string;
  /** Optional trailing slot next to the label — e.g. an info button. */
  labelAction?: ReactNode;
  /** When true, shows a green check on the right side (e.g. valid email). */
  valid?: boolean;
  /**
   * Optional 0..1 "how close to valid" signal. When set, the border tint
   * smoothly interpolates idle → amber → lime → emerald as the user types.
   * Errors still override this to red.
   */
  progress?: number;
};

export function AuthInput({
  icon,
  isPassword = false,
  error,
  label,
  labelAction,
  valid = false,
  progress,
  style,
  onFocus,
  onBlur,
  value,
  ...rest
}: Props) {
  const theme = useTheme();
  const [showPass, setShowPass] = useState(false);
  const focus = useSharedValue(0);
  const progressShared = useSharedValue(progress ?? 0);

  useEffect(() => {
    progressShared.value = withTiming(progress ?? 0, { duration: 220 });
  }, [progress, progressShared]);

  /**
   * iOS draws `secureTextEntry` bullets via a UIKit path that doesn't honour
   * the React Native `color` style after Strong Password / iCloud Keychain
   * autofill — in dark mode the dots come out near-black. Toggling
   * `secureTextEntry` (e.g. tapping the eye twice) makes iOS rebuild the
   * field and the bullets get the right colour. We automate that toggle:
   * when we detect autofill (a big jump in value length in a single update),
   * we flip secure off → on for a single frame. The password isn't visible
   * because React batches the re-renders within the same tick.
   */
  const [autofillRefresh, setAutofillRefresh] = useState(false);
  const prevValueLenRef = useRef(typeof value === "string" ? value.length : 0);

  useEffect(() => {
    const len = typeof value === "string" ? value.length : 0;
    const delta = len - prevValueLenRef.current;
    prevValueLenRef.current = len;

    const eligible =
      Platform.OS === "ios" &&
      theme.scheme === "dark" &&
      isPassword &&
      !showPass;

    /* Autofill / paste: value jumped by more than 2 chars in one update.
       Manual typing only adds 1 char at a time. */
    if (!eligible || delta <= 2 || len === 0) return undefined;

    setAutofillRefresh(true);
    const id = setTimeout(() => setAutofillRefresh(false), 0);
    return () => clearTimeout(id);
  }, [value, isPassword, showPass, theme.scheme]);

  const baseBg     = theme.scheme === "dark" ? theme.colors.surface : "#F5F5F7";
  const focusedBg  = theme.scheme === "dark" ? "#1B2236"            : "#FFFFFF";
  const idleBorder = theme.scheme === "dark" ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.06)";
  const focusBorder = theme.colors.primary;

  /**
   * Border color resolution (worklet, runs on UI thread):
   *   error          → solid red
   *   progress > 0   → idle → amber → lime → emerald (progress wins over focus tint)
   *   else           → idle → primary (focus blend)
   */
  const animatedBorder = useDerivedValue(() => {
    if (error) return STATUS_ERROR;
    const focusBlend = interpolateColor(focus.value, [0, 1], [idleBorder, focusBorder]);
    if (progressShared.value <= 0.01) return focusBlend;
    /* Two-stop gradient: focus → amber → emerald. Skipping the lime middle
       keeps the transition feeling editorial rather than playground-y. */
    return interpolateColor(
      progressShared.value,
      [0, 0.55, 1],
      [focusBlend, STATUS_WARNING, STATUS_SUCCESS],
    );
  });

  const animatedContainerStyle = useAnimatedStyle(() => ({
    borderColor: animatedBorder.value,
    backgroundColor: error
      ? baseBg
      : interpolateColor(focus.value, [0, 1], [baseBg, focusedBg]),
  }));

  type FocusHandler = NonNullable<TextInputProps["onFocus"]>;
  type BlurHandler  = NonNullable<TextInputProps["onBlur"]>;
  const handleFocus: FocusHandler = (e) => {
    focus.value = withTiming(1, { duration: 180 });
    onFocus?.(e);
  };
  const handleBlur: BlurHandler = (e) => {
    focus.value = withTiming(0, { duration: 180 });
    onBlur?.(e);
  };

  const showSuccess = valid && !error;
  const showError   = !!error;

  return (
    <View style={{ gap: 6 }}>
      {label ? (
        <View style={styles.labelRow}>
          <ThemedText
            variant="caption"
            style={{ color: theme.colors.textSecondary, fontWeight: "600" }}
          >
            {label}
          </ThemedText>
          {labelAction}
        </View>
      ) : null}

      <Animated.View
        style={[
          styles.container,
          {
            borderRadius: theme.radius.md,
          },
          animatedContainerStyle,
        ]}
      >
        <Ionicons
          name={icon}
          size={18}
          color={error ? STATUS_ERROR : theme.colors.textSecondary}
        />

        <TextInput
          {...rest}
          value={value}
          secureTextEntry={isPassword && !showPass && !autofillRefresh}
          onFocus={handleFocus}
          onBlur={handleBlur}
          /* Theme-match the keyboard chrome / autofill banner so iOS doesn't
             paint a light overlay on dark mode fields. */
          keyboardAppearance={theme.scheme === "dark" ? "dark" : "light"}
          selectionColor={theme.colors.primary}
          cursorColor={theme.colors.primary}
          style={[styles.input, { color: theme.colors.textPrimary }, style]}
          placeholderTextColor={theme.colors.textSecondary}
        />

        {showSuccess ? (
          <View style={styles.successBadge}>
            <Ionicons name="checkmark-sharp" size={11} color="#FFFFFF" />
          </View>
        ) : showError ? (
          <Ionicons name="alert-circle" size={16} color={STATUS_ERROR} />
        ) : null}

        {isPassword && (
          <Pressable
            onPress={() => setShowPass((v) => !v)}
            hitSlop={12}
            accessibilityLabel={showPass ? "Hide password" : "Show password"}
          >
            <Ionicons
              name={showPass ? "eye-off-outline" : "eye-outline"}
              size={18}
              color={theme.colors.textSecondary}
            />
          </Pressable>
        )}
      </Animated.View>

      {error ? (
        <View style={styles.errorRow}>
          <Ionicons name="information-circle" size={13} color={STATUS_ERROR} />
          <ThemedText variant="caption" style={{ color: STATUS_ERROR }}>
            {error}
          </ThemedText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    paddingHorizontal: 16,
    gap: 12,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginLeft: 4,
    marginRight: 4,
  },
  input: { flex: 1, paddingVertical: 16, fontSize: 16 },
  successBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#059669",
    alignItems: "center",
    justifyContent: "center",
  },
  errorRow: { flexDirection: "row", alignItems: "center", gap: 4, marginLeft: 4 },
});
