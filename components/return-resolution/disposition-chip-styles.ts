import type { ComponentProps } from "react";
import type { Ionicons } from "@expo/vector-icons";
import type { RefundKind } from "@/lib/return-resolution";
import {
  resolveStatusTone,
  TONE_CANCELLED,
  TONE_PLACED,
  TONE_PROCESSING,
  TONE_RETURN_REQUESTED,
  type StatusScheme,
} from "@/lib/status-colors";

export type DispositionChipStyle = {
  bg: string;
  color: string;
  icon: ComponentProps<typeof Ionicons>["name"];
  label: string;
};

function chipBg(color: string, scheme: StatusScheme): string {
  const alpha = scheme === "dark" ? "38" : "24";
  return `${color}${alpha}`;
}

export function returnChipStyle(returnAccepted: boolean, isDark: boolean): DispositionChipStyle {
  const scheme: StatusScheme = isDark ? "dark" : "light";
  if (returnAccepted) {
    const color = resolveStatusTone(TONE_PLACED, scheme);
    return {
      icon: "checkmark-circle",
      label: "Return accepted",
      color,
      bg: chipBg(color, scheme),
    };
  }
  const color = resolveStatusTone(TONE_CANCELLED, scheme);
  return {
    icon: "close-circle",
    label: "Return denied",
    color,
    bg: chipBg(color, scheme),
  };
}

export function refundChipStyle(kind: RefundKind, isDark: boolean): DispositionChipStyle {
  const scheme: StatusScheme = isDark ? "dark" : "light";
  switch (kind) {
    case "full": {
      const color = resolveStatusTone(TONE_PLACED, scheme);
      return {
        icon: "cash",
        label: "Full refund",
        color,
        bg: chipBg(color, scheme),
      };
    }
    case "partial": {
      const color = resolveStatusTone(TONE_PROCESSING, scheme);
      return {
        icon: "pie-chart",
        label: "Partial refund",
        color,
        bg: chipBg(color, scheme),
      };
    }
    case "none":
    default: {
      const color = resolveStatusTone(TONE_RETURN_REQUESTED, scheme);
      return {
        icon: "ban",
        label: "No refund",
        color,
        bg: chipBg(color, scheme),
      };
    }
  }
}

export function pendingChipStyle(isDark: boolean): DispositionChipStyle {
  const scheme: StatusScheme = isDark ? "dark" : "light";
  const color = resolveStatusTone(TONE_PROCESSING, scheme);
  return {
    icon: "time",
    label: "Pending review",
    color,
    bg: chipBg(color, scheme),
  };
}
