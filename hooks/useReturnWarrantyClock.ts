import { useEffect, useState } from "react";
import { getReturnWarrantySnapshot } from "@/lib/order-line";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const TICK_UNDER_TWO_DAYS_MS = 30_000;
const TICK_DEFAULT_MS = 60_000;

type ShippedLine = { status: string; shipped_at: string | null };

/** Soonest active return window across order lines (for one shared screen timer). */
export function nearestWarrantyRemainingMs(
  lines: readonly ShippedLine[],
  now = Date.now(),
): number | null {
  let nearest: number | null = null;
  for (const line of lines) {
    if (line.status !== "delivered") continue;
    const snap = getReturnWarrantySnapshot(line.shipped_at, now);
    if (!snap?.eligible) continue;
    if (nearest === null || snap.remainingMs < nearest) nearest = snap.remainingMs;
  }
  return nearest;
}

/**
 * One clock for a list screen — avoids N intervals on every order line.
 */
export function useSharedReturnWarrantyNow(
  lines: readonly ShippedLine[],
  enabled: boolean,
): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!enabled) return;

    const bump = () => setNow(Date.now());
    bump();

    const nearest = nearestWarrantyRemainingMs(lines, Date.now());
    if (nearest === null) return;

    const expiryTimer = setTimeout(bump, nearest + 50);
    const tickMs = nearest <= 2 * MS_PER_DAY ? TICK_UNDER_TWO_DAYS_MS : TICK_DEFAULT_MS;
    const tickTimer = setInterval(bump, tickMs);

    return () => {
      clearTimeout(expiryTimer);
      clearInterval(tickTimer);
    };
  }, [enabled, lines.length, lines]);

  return now;
}

/** Per-line clock — use only for modals/single-item UI, not inside long lists. */
export function useReturnWarrantyNow(shippedAt: string | null): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!shippedAt) return;

    const bump = () => setNow(Date.now());
    bump();

    const snap = getReturnWarrantySnapshot(shippedAt, Date.now());
    if (!snap || snap.windowEnded) return;

    const expiryTimer = setTimeout(bump, snap.remainingMs + 50);
    const tickMs =
      snap.remainingMs <= 2 * MS_PER_DAY ? TICK_UNDER_TWO_DAYS_MS : TICK_DEFAULT_MS;
    const tickTimer = setInterval(bump, tickMs);

    return () => {
      clearTimeout(expiryTimer);
      clearInterval(tickTimer);
    };
  }, [shippedAt]);

  return now;
}
