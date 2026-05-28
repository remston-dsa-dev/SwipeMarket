import type { ReturnRequestRow } from "@/hooks/useReturnRequests";
import { formatOrderLabel } from "@/lib/order-label";

export type ReturnLineGroup = {
  orderItemId: string;
  title: string;
  imageUrl: string;
  unitPriceCents: number;
  lineQty: number;
  requests: ReturnRequestRow[];
  latestAt: string;
  pendingCount: number;
};

export type ReturnOrderGroup = {
  orderId: string;
  orderLabel: string;
  lineGroups: ReturnLineGroup[];
  latestAt: string;
  pendingCount: number;
  requestCount: number;
};

function sortRequestsNewestFirst(requests: ReturnRequestRow[]): ReturnRequestRow[] {
  return [...requests].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

/** Group return requests by order, then by order line (newest activity first). */
export function groupReturnRequestsByOrder(requests: ReturnRequestRow[]): ReturnOrderGroup[] {
  const byOrder = new Map<string, ReturnRequestRow[]>();

  for (const request of requests) {
    const list = byOrder.get(request.order_id) ?? [];
    list.push(request);
    byOrder.set(request.order_id, list);
  }

  const orders: ReturnOrderGroup[] = [];

  for (const [orderId, orderRequests] of byOrder) {
    const byLine = new Map<string, ReturnRequestRow[]>();
    for (const request of orderRequests) {
      const list = byLine.get(request.order_item_id) ?? [];
      list.push(request);
      byLine.set(request.order_item_id, list);
    }

    const lineGroups: ReturnLineGroup[] = [];

    for (const [orderItemId, lineRequests] of byLine) {
      const sorted = sortRequestsNewestFirst(lineRequests);
      const first = sorted[0]!;
      const pendingCount = sorted.filter((r) => r.status === "requested").length;

      lineGroups.push({
        orderItemId,
        title: first.order_item.title,
        imageUrl: first.order_item.image_url,
        unitPriceCents: first.order_item.unit_price_cents,
        lineQty: first.order_item.qty,
        requests: sorted,
        latestAt: first.created_at,
        pendingCount,
      });
    }

    lineGroups.sort(
      (a, b) => new Date(b.latestAt).getTime() - new Date(a.latestAt).getTime(),
    );

    const latestAt = lineGroups[0]?.latestAt ?? orderRequests[0]!.created_at;
    const pendingCount = orderRequests.filter((r) => r.status === "requested").length;

    orders.push({
      orderId,
      orderLabel: formatOrderLabel(orderId),
      lineGroups,
      latestAt,
      pendingCount,
      requestCount: orderRequests.length,
    });
  }

  orders.sort((a, b) => {
    if (a.pendingCount !== b.pendingCount) return b.pendingCount - a.pendingCount;
    return new Date(b.latestAt).getTime() - new Date(a.latestAt).getTime();
  });

  return orders;
}
