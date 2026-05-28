import {
  resolveStatusTone,
  statusBadgeStyle,
  TONE_CANCELLED,
  TONE_DELIVERED,
  TONE_PLACED,
  TONE_PROCESSING,
  TONE_RETURN_APPROVED,
  TONE_RETURN_REQUESTED,
  TONE_RETURNED,
  TONE_SHIPPED,
  type StatusScheme,
} from "@/lib/status-colors";

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

export function orderStatusColor(status: OrderStatus, scheme: StatusScheme): string {
  switch (status) {
    case "placed":
      return resolveStatusTone(TONE_PLACED, scheme);
    case "processing":
      return resolveStatusTone(TONE_PROCESSING, scheme);
    case "shipped":
      return resolveStatusTone(TONE_SHIPPED, scheme);
    case "delivered":
      return resolveStatusTone(TONE_DELIVERED, scheme);
    case "cancelled":
      return resolveStatusTone(TONE_CANCELLED, scheme);
    default:
      return resolveStatusTone(TONE_PLACED, scheme);
  }
}

/** Shared badge colors for order header and line status chips (shopper + partner). */
export function orderStatusBadgeStyle(
  status: OrderStatus,
  scheme: StatusScheme,
): {
  borderColor: string;
  backgroundColor: string;
  textColor: string;
} {
  return statusBadgeStyle(orderStatusColor(status, scheme), scheme);
}

/** Return states shown instead of "Delivered" on orders / lines. */
export type ShopperReturnDisplayStatus =
  | "return_requested"
  | "return_approved"
  | "returned";

export type ShopperDisplayStatus = OrderStatus | ShopperReturnDisplayStatus;

export function shopperDisplayStatusLabel(status: ShopperDisplayStatus): string {
  switch (status) {
    case "return_requested":
      return "Return requested";
    case "return_approved":
      return "Return Approved";
    case "returned":
      return "Returned";
    default:
      return orderStatusLabel(status);
  }
}

export function shopperDisplayStatusColor(
  status: ShopperDisplayStatus,
  scheme: StatusScheme,
): string {
  switch (status) {
    case "return_requested":
      return resolveStatusTone(TONE_RETURN_REQUESTED, scheme);
    case "return_approved":
      return resolveStatusTone(TONE_RETURN_APPROVED, scheme);
    case "returned":
      return resolveStatusTone(TONE_RETURNED, scheme);
    default:
      return orderStatusColor(status, scheme);
  }
}

export function shopperDisplayStatusBadgeStyle(
  status: ShopperDisplayStatus,
  scheme: StatusScheme,
): {
  borderColor: string;
  backgroundColor: string;
  textColor: string;
} {
  return statusBadgeStyle(shopperDisplayStatusColor(status, scheme), scheme);
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
