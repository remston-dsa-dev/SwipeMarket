/** Unique return request ids nested on order line items (fallback when returns query is empty). */
export function countReturnRequestsInOrders(
  orders: readonly { order_items: readonly { return_requests?: readonly { id: string }[] | null }[] }[],
): number {
  const seen = new Set<string>();
  for (const order of orders) {
    for (const line of order.order_items) {
      for (const req of line.return_requests ?? []) {
        seen.add(req.id);
      }
    }
  }
  return seen.size;
}
