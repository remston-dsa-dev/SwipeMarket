import type { OrderStatus } from "@/lib/order-status";

export const RETURN_WARRANTY_DAYS = 30;
const MS_PER_HOUR = 60 * 60 * 1000;
const MS_PER_DAY = 24 * MS_PER_HOUR;
const RETURN_WARRANTY_MS = RETURN_WARRANTY_DAYS * MS_PER_DAY;

export type ReturnWarrantySnapshot = {
  remainingMs: number;
  expiresAtMs: number;
  /** Full days left (0 on the final partial day). */
  daysLeft: number;
  eligible: boolean;
  windowEnded: boolean;
};

/** Hard check from shipped_at + exact 30×24h window (optional `now` for tests). */
export function getReturnWarrantySnapshot(
  shippedAt: string | null,
  now = Date.now(),
): ReturnWarrantySnapshot | null {
  if (!shippedAt) return null;
  const shippedMs = new Date(shippedAt).getTime();
  if (Number.isNaN(shippedMs)) return null;

  const expiresAtMs = shippedMs + RETURN_WARRANTY_MS;
  const remainingMs = expiresAtMs - now;
  const windowEnded = remainingMs <= 0;

  return {
    remainingMs: Math.max(0, remainingMs),
    expiresAtMs,
    daysLeft: windowEnded ? 0 : Math.floor(remainingMs / MS_PER_DAY),
    eligible: !windowEnded,
    windowEnded,
  };
}

/** Live-friendly label: days, hours, or minutes left. */
export function formatReturnWarrantyRemaining(snapshot: ReturnWarrantySnapshot): string {
  if (snapshot.windowEnded) return "Return window ended";

  const { remainingMs } = snapshot;
  const days = Math.floor(remainingMs / MS_PER_DAY);
  const hours = Math.floor((remainingMs % MS_PER_DAY) / MS_PER_HOUR);
  const minutes = Math.floor((remainingMs % MS_PER_HOUR) / (60 * 1000));

  if (days >= 2) return `${days} days left`;
  if (days === 1) return hours > 0 ? `1 day, ${hours} hr left` : "1 day left";
  if (hours >= 2) return `${hours} hours left`;
  if (hours === 1) return minutes > 0 ? `1 hr ${minutes} min left` : "1 hour left";
  if (minutes >= 1) return `${minutes} min left`;
  return "Less than 1 min left";
}

export function formatReturnWarrantyExpiresAt(expiresAtMs: number): string {
  return new Date(expiresAtMs).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

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

export function isLineReturnEligible(line: OrderLineFields, now = Date.now()): boolean {
  if (lineReturnableQty(line) <= 0) return false;
  if (line.status !== "delivered") return false;
  const snap = getReturnWarrantySnapshot(line.shipped_at, now);
  return !!snap?.eligible;
}

/** @deprecated Prefer getReturnWarrantySnapshot + formatReturnWarrantyRemaining */
export function returnWarrantyDaysRemaining(
  shippedAt: string | null,
  now = Date.now(),
): number | null {
  const snap = getReturnWarrantySnapshot(shippedAt, now);
  if (!snap) return null;
  return snap.daysLeft;
}
