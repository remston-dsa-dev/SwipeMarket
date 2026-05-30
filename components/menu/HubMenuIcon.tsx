import { Text, type TextStyle } from "react-native";

export type HubMenuIconName =
  | "cart"
  | "discover"
  | "orders"
  | "returns"
  | "favorites"
  | "more"
  | "publish-inventory"
  | "add-listing"
  | "sign-out";

const EMOJI: Record<HubMenuIconName, string> = {
  cart: "🛒",
  discover: "🛍️",
  orders: "📦",
  returns: "↩️",
  favorites: "❤️",
  more: "⚙️",
  "publish-inventory": "📋",
  "add-listing": "➕",
  "sign-out": "🚪",
};

type Props = {
  name: HubMenuIconName;
  size?: number;
  style?: TextStyle;
};

/** Emoji glyph for hub menu + empty-state tiles. */
export function HubMenuIcon({ name, size = 30, style }: Props) {
  return (
    <Text
      style={[{ fontSize: size, lineHeight: Math.round(size * 1.12), textAlign: "center" }, style]}
      accessibilityElementsHidden
      importantForAccessibility="no"
    >
      {EMOJI[name]}
    </Text>
  );
}

export function hubMenuEmoji(name: HubMenuIconName): string {
  return EMOJI[name];
}

/** Empty-state CTA targets — use the destination screen’s hub icon. */
export type EmptyStateCtaIcon = HubMenuIconName;

/** Emoji for an empty-state button — use the destination screen’s icon, not the current screen. */
export function emptyStateCtaEmoji(icon: EmptyStateCtaIcon): string {
  return EMOJI[icon];
}
