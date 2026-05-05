import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Dimensions, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { ListingCard } from "@/components/ListingCard";
import { PressableScale } from "@/components/PressableScale";
import { Screen } from "@/components/Screen";
import { ThemedText } from "@/components/ThemedText";
import { useListings } from "@/hooks/useListings";
import { useSessionStore } from "@/stores/session-store";
import { useTheme } from "@/theme/ThemeContext";

const { width } = Dimensions.get("window");

export default function SwipeScreen() {
  const router = useRouter();
  const theme = useTheme();
  const clearSession = useSessionStore((s) => s.clearSession);
  const { data: listings = [], isLoading } = useListings();
  const [index, setIndex] = useState(0);

  const translateX = useSharedValue(0);
  const rotateZ = useSharedValue(0);

  const dismissCard = useCallback(() => {
    translateX.value = 0;
    rotateZ.value = 0;
    setIndex((value) => value + 1);
  }, [rotateZ, translateX]);

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
      rotateZ.value = (event.translationX / width) * 12;
    })
    .onEnd((event) => {
      const magnitude = Math.abs(event.translationX);
      const velocityBoost = Math.abs(event.velocityX) > 650;
      const crossed = magnitude > width * 0.22;
      if (crossed || velocityBoost) {
        const direction = event.translationX >= 0 ? 1 : -1;
        translateX.value = withTiming(
          direction * width * 1.35,
          { duration: 220 },
          (finished) => {
            if (finished) {
              runOnJS(dismissCard)();
            }
          },
        );
        rotateZ.value = withTiming(direction * 14, { duration: 220 });
      } else {
        translateX.value = withSpring(0);
        rotateZ.value = withSpring(0);
      }
    });

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { rotateZ: `${rotateZ.value}deg` },
    ],
  }));

  const current = listings[index];
  const upcoming = listings[index + 1];

  return (
    <Screen>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <View style={{ gap: 4 }}>
          <ThemedText variant="headline">Discover</ThemedText>
          <ThemedText variant="caption" color="muted">
            Swipe cards with spring physics and glass surfaces.
          </ThemedText>
        </View>
        <PressableScale
          accessibilityLabel="Open matches"
          onPress={() => router.push("/matches")}
          style={{
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderRadius: theme.radius.pill,
            borderWidth: 1,
            borderColor: theme.colors.glassBorder,
            backgroundColor: theme.colors.overlay,
          }}
        >
          <ThemedText variant="caption">Matches</ThemedText>
        </PressableScale>
      </View>

      <View style={{ flex: 1, justifyContent: "center" }}>
        {isLoading ? (
          <ThemedText variant="body" color="muted">
            Loading listings…
          </ThemedText>
        ) : null}

        {!isLoading && current ? (
          <View style={{ height: 460, justifyContent: "center" }}>
            {upcoming ? (
              <View
                style={{
                  position: "absolute",
                  width: "100%",
                  transform: [{ scale: 0.94 }],
                  opacity: 0.85,
                }}
                pointerEvents="none"
              >
                <ListingCard listing={upcoming} />
              </View>
            ) : null}

            <GestureDetector gesture={panGesture}>
              <Animated.View style={[animatedCardStyle, { width: "100%" }]}>
                <ListingCard listing={current} />
              </Animated.View>
            </GestureDetector>
          </View>
        ) : null}

        {!isLoading && !current ? (
          <View style={{ gap: 12 }}>
            <ThemedText variant="headline">You are all caught up</ThemedText>
            <ThemedText variant="body" color="muted">
              New listings will land here from Supabase soon.
            </ThemedText>
            <PressableScale
              accessibilityLabel="Sign out"
              onPress={() => {
                clearSession();
                router.replace("/sign-in");
              }}
              style={{
                alignSelf: "flex-start",
                marginTop: 8,
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderRadius: theme.radius.md,
                borderWidth: 1,
                borderColor: theme.colors.border,
              }}
            >
              <ThemedText variant="label">Sign out</ThemedText>
            </PressableScale>
          </View>
        ) : null}
      </View>
    </Screen>
  );
}
