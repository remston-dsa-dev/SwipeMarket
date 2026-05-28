/**
 * Order / return status tones — softer in dark mode for less eye strain.
 * Each pair: light (deeper -600 family) · dark (muted -400 family).
 */

export type StatusScheme = "light" | "dark";

export type StatusTonePair = {
  light: string;
  dark: string;
};

export function resolveStatusTone(tone: StatusTonePair, scheme: StatusScheme): string {
  return scheme === "dark" ? tone.dark : tone.light;
}

/** Placed — green */
export const TONE_PLACED: StatusTonePair = {
  light: "#16A34A",
  dark: "#4ADE80",
};

/** Processing — yellow */
export const TONE_PROCESSING: StatusTonePair = {
  light: "#CA8A04",
  dark: "#FACC15",
};

/** Shipped — blue */
export const TONE_SHIPPED: StatusTonePair = {
  light: "#0284C7",
  dark: "#38BDF8",
};

/** Delivered — orange */
export const TONE_DELIVERED: StatusTonePair = {
  light: "#EA580C",
  dark: "#FB923C",
};

/** Cancelled — red */
export const TONE_CANCELLED: StatusTonePair = {
  light: "#DC2626",
  dark: "#F87171",
};

/** Return requested — gray */
export const TONE_RETURN_REQUESTED: StatusTonePair = {
  light: "#64748B",
  dark: "#94A3B8",
};

/** Return approved — yellow (same family as processing) */
export const TONE_RETURN_APPROVED: StatusTonePair = TONE_PROCESSING;

/** Returned — blue (same family as shipped) */
export const TONE_RETURNED: StatusTonePair = TONE_SHIPPED;

/** Badge fill alpha suffix (hex) per scheme */
export function statusBadgeBackgroundAlpha(scheme: StatusScheme): string {
  return scheme === "dark" ? "24" : "18";
}

export function statusBadgeStyle(color: string, scheme: StatusScheme) {
  return {
    borderColor: color,
    backgroundColor: `${color}${statusBadgeBackgroundAlpha(scheme)}`,
    textColor: color,
  };
}

/** Legacy / disposition chips — keep semantic names mapped to tones */
export const STATUS_SUCCESS = TONE_PLACED.light;
export const STATUS_WARNING = TONE_PROCESSING.light;
export const STATUS_ERROR = TONE_CANCELLED.light;
export const STATUS_SHIPPED = TONE_SHIPPED.light;
export const STATUS_RETURNED = TONE_RETURNED.light;

/** Strength ladder, weak → excellent. */
export const TIER_DANGER = TONE_CANCELLED.light;
export const TIER_WEAK = "#EA580C";
export const TIER_FAIR = TONE_PROCESSING.light;
export const TIER_STRONG = "#16A34A";
export const TIER_BEST = STATUS_SUCCESS;
