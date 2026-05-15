import type { ReactNode } from "react";
import {
  Pressable,
  type AccessibilityState,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = {
  children: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityState?: AccessibilityState;
  disabled?: boolean;
  /**
   * When false, skips the press shrink — use on surfaces with lots of text
   * so iOS/Android don’t rasterize labels at fractional scales (looks blurry).
   */
  scaleOnPress?: boolean;
};

export function PressableScale({
  children,
  onPress,
  style,
  accessibilityLabel,
  accessibilityState,
  disabled = false,
  scaleOnPress = true,
}: Props) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={accessibilityState}
      disabled={disabled}
      onPress={onPress}
      onPressIn={() => {
        if (disabled || !scaleOnPress) return;
        scale.value = withSpring(0.96, { damping: 15, stiffness: 400 });
      }}
      onPressOut={() => {
        if (disabled || !scaleOnPress) return;
        scale.value = withSpring(1, { damping: 15, stiffness: 400 });
      }}
      style={[animatedStyle, style]}
    >
      {children}
    </AnimatedPressable>
  );
}
