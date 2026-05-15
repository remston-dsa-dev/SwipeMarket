import { useEffect, useMemo } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

const DEFAULT_COLORS = [
  "#7C3AED", // brand purple
  "#A855F7", // violet
  "#EC4899", // brand pink
  "#F59E0B", // amber
  "#22D3EE", // cyan
  "#34D399", // emerald
  "#FCD34D", // gold
];

type Props = {
  /** Number of pieces. Default 60 — plenty without thrashing the JS thread. */
  count?: number;
  /** Total time before particles finish falling. */
  durationMs?: number;
  /** When false, animation skips (useful for tests). */
  active?: boolean;
  colors?: string[];
};

/**
 * Lightweight, native-driven confetti using Reanimated.
 *
 * Each piece is a small rotated rectangle that falls from above the top of
 * the screen down past the bottom, with a horizontal sway and continuous
 * spin. Every animation is wrapped in `withRepeat(-1)` so the rain keeps
 * going for as long as the component is mounted — perfect for a celebratory
 * "stay-happy" overlay. ~60 pieces by default keeps this well within budget
 * on low-end Android devices.
 */
export function Confetti({
  count       = 60,
  durationMs  = 4200,
  active      = true,
  colors      = DEFAULT_COLORS,
}: Props) {
  /* Particles are stable per mount — we compute random props once. */
  const particles = useMemo(
    () => Array.from({ length: count }, (_, i) => buildParticle(i, colors)),
    [count, colors],
  );

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {particles.map((p) => (
        <Piece
          key={p.id}
          particle={p}
          durationMs={durationMs}
          active={active}
        />
      ))}
    </View>
  );
}

type Particle = {
  id: number;
  x: number;
  width: number;
  height: number;
  color: string;
  delayMs: number;
  fallMs: number;
  swayAmplitude: number;
  swayMs: number;
  spinMs: number;
  startRotationDeg: number;
};

function buildParticle(id: number, colors: string[]): Particle {
  const width = 6 + Math.random() * 6;          // 6..12
  const height = width * (1.4 + Math.random()); // taller than wide → "confetti strip"
  return {
    id,
    x: Math.random() * SCREEN_W,
    width,
    height,
    color: colors[id % colors.length] ?? colors[0]!,
    delayMs: Math.random() * 1400,
    fallMs: 2200 + Math.random() * 1800,
    swayAmplitude: 14 + Math.random() * 32,
    swayMs: 900 + Math.random() * 900,
    spinMs: 700 + Math.random() * 1500,
    startRotationDeg: Math.random() * 360,
  };
}

function Piece({
  particle,
  durationMs: _durationMs,
  active,
}: {
  particle: Particle;
  durationMs: number;
  active: boolean;
}) {
  const fall = useSharedValue(-30 - Math.random() * 200); // start above the screen
  const sway = useSharedValue(0);
  const spin = useSharedValue(particle.startRotationDeg);
  const opacity = useSharedValue(0);

  /* Trigger animations once on mount. We deliberately don't depend on
     `active` to retrigger — Confetti is a fire-and-forget mount. */
  useEffect(() => {
    if (!active) return;

    /* Opacity loop: fade IN → hold → fade OUT, then `withRepeat` resets the
       value back to the pre-animation start (0) and the cycle replays. The
       single-assignment + `withSequence` shape is intentional — splitting
       these phases across two `opacity.value = …` writes would cancel the
       first animation and leave the piece permanently invisible. */
    const fadeInMs   = 220;
    const fadeOutMs  = 500;
    const holdMs     = Math.max(0, particle.fallMs - fadeInMs - fadeOutMs);
    opacity.value = withDelay(
      particle.delayMs,
      withRepeat(
        withSequence(
          withTiming(1, { duration: fadeInMs }),
          withDelay(holdMs, withTiming(0, { duration: fadeOutMs })),
        ),
        -1,
        false,
      ),
    );

    /* Fall loop: animate down past the bottom, `withRepeat` snaps back to
       the initial off-screen-top value, fall again. Each particle's random
       `fallMs` keeps the swarm naturally desynchronized over time. */
    fall.value = withDelay(
      particle.delayMs,
      withRepeat(
        withTiming(SCREEN_H + 60, {
          duration: particle.fallMs,
          easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
        }),
        -1,
        false,
      ),
    );

    /* Horizontal sway: oscillate -amp → +amp → -amp → … via [0,1] flag. */
    sway.value = withDelay(
      particle.delayMs,
      withRepeat(
        withTiming(1, {
          duration: particle.swayMs,
          easing: Easing.inOut(Easing.sin),
        }),
        -1,
        true,
      ),
    );

    spin.value = withDelay(
      particle.delayMs,
      withRepeat(
        withTiming(particle.startRotationDeg + 360, {
          duration: particle.spinMs,
          easing: Easing.linear,
        }),
        -1,
        false,
      ),
    );
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [active]);

  const style = useAnimatedStyle(() => {
    /* sway in [0,1] → translateX in [-amp, +amp] */
    const swayX = (sway.value * 2 - 1) * particle.swayAmplitude;
    return {
      opacity: opacity.value,
      transform: [
        { translateX: swayX },
        { translateY: fall.value },
        { rotate: `${spin.value}deg` },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.piece,
        {
          left: particle.x,
          width: particle.width,
          height: particle.height,
          backgroundColor: particle.color,
          borderRadius: Math.max(1, particle.width / 4),
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  piece: { position: "absolute", top: 0 },
});
