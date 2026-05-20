import type { ComponentProps } from "react";
import type { Ionicons } from "@expo/vector-icons";
import type { RefundKind } from "@/lib/return-resolution";
import { STATUS_ERROR, STATUS_SUCCESS, STATUS_WARNING } from "@/lib/status-colors";

export type DispositionChipStyle = {
  bg: string;
  color: string;
  icon: ComponentProps<typeof Ionicons>["name"];
  label: string;
};

export function returnChipStyle(returnAccepted: boolean, isDark: boolean): DispositionChipStyle {
  if (returnAccepted) {
    return {
      icon: "checkmark-circle",
      label: "Return accepted",
      color: isDark ? "#34D399" : STATUS_SUCCESS,
      bg: isDark ? "rgba(52,211,153,0.22)" : "rgba(5,150,105,0.14)",
    };
  }
  return {
    icon: "close-circle",
    label: "Return denied",
    color: isDark ? "#F87171" : STATUS_ERROR,
    bg: isDark ? "rgba(248,113,113,0.2)" : "rgba(220,38,38,0.12)",
  };
}

export function refundChipStyle(kind: RefundKind, isDark: boolean): DispositionChipStyle {
  switch (kind) {
    case "full":
      return {
        icon: "cash",
        label: "Full refund",
        color: isDark ? "#34D399" : STATUS_SUCCESS,
        bg: isDark ? "rgba(52,211,153,0.22)" : "rgba(5,150,105,0.14)",
      };
    case "partial":
      return {
        icon: "pie-chart",
        label: "Partial refund",
        color: isDark ? "#FBBF24" : STATUS_WARNING,
        bg: isDark ? "rgba(251,191,36,0.2)" : "rgba(217,119,6,0.14)",
      };
    case "none":
    default:
      return {
        icon: "ban",
        label: "No refund",
        color: isDark ? "#94A3B8" : "#64748B",
        bg: isDark ? "rgba(148,163,184,0.18)" : "rgba(100,116,139,0.12)",
      };
  }
}

export function pendingChipStyle(isDark: boolean): DispositionChipStyle {
  return {
    icon: "time",
    label: "Pending review",
    color: isDark ? "#FBBF24" : STATUS_WARNING,
    bg: isDark ? "rgba(251,191,36,0.2)" : "rgba(217,119,6,0.14)",
  };
}
