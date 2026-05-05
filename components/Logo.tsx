import { Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

type Size = "sm" | "md" | "lg";

type Props = {
  size?: Size;
  showWordmark?: boolean;
  /** Pass true when rendered on a light/white background */
  lightBackground?: boolean;
};

const SIZES = {
  sm: { cardW: 28, cardH: 36, radius: 8,  iconSize: 13, wordSize: 15, gap: 10 },
  md: { cardW: 42, cardH: 54, radius: 12, iconSize: 18, wordSize: 22, gap: 14 },
  lg: { cardW: 60, cardH: 76, radius: 18, iconSize: 24, wordSize: 30, gap: 18 },
};

export function Logo({ size = "md", showWordmark = true, lightBackground = false }: Props) {
  const { cardW, cardH, radius, iconSize, wordSize, gap } = SIZES[size];
  const containerW = cardW + 16;
  const containerH = cardH + 12;

  return (
    <View style={{ alignItems: "center", gap }}>
      {/* Card stack mark */}
      <View style={{ width: containerW, height: containerH }}>
        {/* Back card — gradient, tilted left */}
        <LinearGradient
          colors={["#7C3AED", "#EC4899"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            position: "absolute",
            width: cardW,
            height: cardH,
            borderRadius: radius,
            top: 4,
            left: 0,
            transform: [{ rotate: "-8deg" }],
          }}
        />

        {/* Middle card — lighter purple, slight offset */}
        <LinearGradient
          colors={["#A78BFA", "#C084FC"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            position: "absolute",
            width: cardW,
            height: cardH,
            borderRadius: radius,
            top: 2,
            left: 6,
            transform: [{ rotate: "-3deg" }],
            opacity: 0.7,
          }}
        />

        {/* Front card — white with heart icon */}
        <View
          style={{
            position: "absolute",
            right: 0,
            bottom: 0,
            width: cardW,
            height: cardH,
            borderRadius: radius,
            backgroundColor: "white",
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: "rgba(124,58,237,0.12)",
            shadowColor: "#7C3AED",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.3,
            shadowRadius: 16,
            elevation: 12,
          }}
        >
          <Ionicons name="heart" size={iconSize} color="#7C3AED" />
        </View>
      </View>

      {/* Wordmark */}
      {showWordmark && (
        <Text
          style={{
            fontSize: wordSize,
            fontWeight: "800",
            letterSpacing: -0.8,
            color: lightBackground ? "#0F172A" : "#FFFFFF",
          }}
        >
          SwipeMarket
        </Text>
      )}
    </View>
  );
}
