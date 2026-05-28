/** Short display id when orders have no separate order-number column. */
export function formatOrderNumber(orderId: string): string {
  return orderId.replace(/-/g, "").slice(0, 8).toUpperCase();
}

export function formatOrderLabel(orderId: string): string {
  return `Order #${formatOrderNumber(orderId)}`;
}
