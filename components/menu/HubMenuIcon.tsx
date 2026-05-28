import { Text, type TextStyle } from "react-native";

export type HubMenuIconName =
  | "orders"
  | "returns"
  | "favorites"
  | "more"
  | "publish-inventory"
  | "add-listing"
  | "sign-out";

const EMOJI: Record<HubMenuIconName, string> = {
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

/** Empty-state CTA targets (hub routes + Discover swipe, which has no menu item). */
export type EmptyStateCtaIcon = HubMenuIconName | "discover";

const CTA_EXTRA_EMOJI: Record<"discover", string> = {
  discover: "🛍️",
};

/** Emoji for an empty-state button — use the destination screen’s icon, not the current screen. */
export function emptyStateCtaEmoji(icon: EmptyStateCtaIcon): string {
  if (icon === "discover") return CTA_EXTRA_EMOJI.discover;
  return EMOJI[icon];
}
