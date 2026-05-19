import type { OrderStatus } from "@/lib/order-status";

export const RETURN_WARRANTY_DAYS = 30;
const RETURN_WARRANTY_MS = RETURN_WARRANTY_DAYS * 24 * 60 * 60 * 1000;

export type OrderLineFields = {
  qty: number;
  return_qty: number;
  status: OrderStatus;
  shipped_at: string | null;
};

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
  if (line.return_qty >= line.qty) return false;
  if (line.status !== "shipped" && line.status !== "completed") return false;
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
