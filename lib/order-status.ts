export type OrderStatus = "placed" | "processing" | "shipped" | "completed" | "cancelled";

export const ORDER_STATUSES: OrderStatus[] = [
  "placed",
  "processing",
  "shipped",
  "completed",
  "cancelled",
];

export function orderStatusLabel(s: OrderStatus): string {
  switch (s) {
    case "placed":
      return "Placed";
    case "processing":
      return "Processing";
    case "shipped":
      return "Shipped";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
    default:
      return s;
  }
}
