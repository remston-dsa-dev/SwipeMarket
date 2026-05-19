import { STATUS_ERROR, STATUS_SUCCESS, STATUS_WARNING } from "@/lib/status-colors";

export type OrderStatus = "placed" | "processing" | "shipped" | "delivered" | "cancelled";

/** Canonical fulfillment order (cancelled is terminal, not part of the timeline). */
export const ORDER_STATUSES: OrderStatus[] = [
  "placed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

/** Timeline steps in fulfillment order — same labels as badges and pickers. */
export const ORDER_TIMELINE_STEPS: OrderStatus[] = [
  "placed",
  "processing",
  "shipped",
  "delivered",
];

export type TimelineStepState = "complete" | "current" | "upcoming";

export function orderTimelineIndex(status: OrderStatus): number {
  if (status === "cancelled") return -1;
  return ORDER_TIMELINE_STEPS.indexOf(status);
}

export function orderTimelineStepState(
  step: OrderStatus,
  current: OrderStatus,
): TimelineStepState {
  if (current === "cancelled") return "upcoming";
  const stepIdx = ORDER_TIMELINE_STEPS.indexOf(step);
  const currentIdx = orderTimelineIndex(current);
  if (stepIdx < currentIdx) return "complete";
  if (stepIdx === currentIdx) return "current";
  return "upcoming";
}

export function orderStatusLabel(s: OrderStatus): string {
  switch (s) {
    case "placed":
      return "Placed";
    case "processing":
      return "Processing";
    case "shipped":
      return "Shipped";
    case "delivered":
      return "Delivered";
    case "cancelled":
      return "Cancelled";
    default:
      return s;
  }
}

export function orderStatusColor(s: OrderStatus): string {
  switch (s) {
    case "placed":
      return "#64748B";
    case "processing":
      return STATUS_WARNING;
    case "shipped":
      return "#2563EB";
    case "delivered":
      return STATUS_SUCCESS;
    case "cancelled":
      return STATUS_ERROR;
    default:
      return "#64748B";
  }
}

/** Shared badge colors for order header and line status chips (shopper + partner). */
export function orderStatusBadgeStyle(status: OrderStatus): {
  borderColor: string;
  backgroundColor: string;
  textColor: string;
} {
  const textColor = orderStatusColor(status);
  return {
    borderColor: textColor,
    backgroundColor: `${textColor}18`,
    textColor,
  };
}

/** Maps legacy DB/API value to the canonical status (for realtime rows not yet migrated). */
export function normalizeOrderStatus(value: string): OrderStatus {
  if (value === "completed") return "delivered";
  if (
    value === "placed" ||
    value === "processing" ||
    value === "shipped" ||
    value === "delivered" ||
    value === "cancelled"
  ) {
    return value;
  }
  return "placed";
}
