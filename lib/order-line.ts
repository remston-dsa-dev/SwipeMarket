import type { OrderStatus } from "@/lib/order-status";

export const RETURN_WARRANTY_DAYS = 30;
const RETURN_WARRANTY_MS = RETURN_WARRANTY_DAYS * 24 * 60 * 60 * 1000;

export type LineReturnRequestSummary = {
  id: string;
  qty: number;
  reason?: string | null;
  status: "requested" | "resolved" | "cancelled";
  resolution: string;
  refund_kind: string;
  refund_cents: number;
  return_accepted: boolean | null;
  created_at: string;
};

export type OrderLineFields = {
  qty: number;
  return_qty: number;
  status: OrderStatus;
  shipped_at: string | null;
  return_requests?: LineReturnRequestSummary[];
};

export function linePendingReturnQty(line: Pick<OrderLineFields, "return_requests">): number {
  return (line.return_requests ?? [])
    .filter((r) => r.status === "requested")
    .reduce((s, r) => s + r.qty, 0);
}

export function lineReturnableQty(line: OrderLineFields): number {
  return Math.max(0, line.qty - line.return_qty - linePendingReturnQty(line));
}

export function orderLineTotals<T extends Pick<OrderLineFields, "qty" | "return_qty">>(
  items: T[],
): { totalCount: number; totalReturns: number; productCount: number } {
  let totalCount = 0;
  let totalReturns = 0;
  for (const line of items) {
    totalCount += line.qty;
    totalReturns += line.return_qty;
  }
  return { totalCount, totalReturns, productCount: items.length };
}

export function orderSummaryLabel(
  productCount: number,
  totalCount: number,
  totalReturns: number,
): string {
  const products = `${productCount} product${productCount === 1 ? "" : "s"}`;
  const total = `${totalCount} total`;
  const returns =
    totalReturns > 0 ? ` · ${totalReturns} returned` : "";
  return `${products} (${total})${returns}`;
}

export function isLineReturnEligible(line: OrderLineFields): boolean {
  if (lineReturnableQty(line) <= 0) return false;
  if (line.status !== "delivered") return false;
  if (!line.shipped_at) return false;
  const shippedMs = new Date(line.shipped_at).getTime();
  if (Number.isNaN(shippedMs)) return false;
  return Date.now() - shippedMs <= RETURN_WARRANTY_MS;
}

export function returnWarrantyDaysRemaining(shippedAt: string | null): number | null {
  if (!shippedAt) return null;
  const shippedMs = new Date(shippedAt).getTime();
  if (Number.isNaN(shippedMs)) return null;
  const remainingMs = RETURN_WARRANTY_MS - (Date.now() - shippedMs);
  if (remainingMs <= 0) return 0;
  return Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
}
