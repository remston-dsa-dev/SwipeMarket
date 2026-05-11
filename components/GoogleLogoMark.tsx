import { Image } from "expo-image";

type Props = {
  /** Display size (square). Source is 128×128; scaled for crisp buttons. */
  size?: number;
};

/** Official multicolor Google “G” (`googleg_standard_color_128dp` from Google branding). */
export function GoogleLogoMark({ size = 22 }: Props) {
  return (
    <Image
      source={require("../assets/google-logo.png")}
      style={{ width: size, height: size }}
      contentFit="contain"
      accessibilityLabel="Google"
    />
  );
}
