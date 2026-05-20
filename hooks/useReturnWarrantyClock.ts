import { useEffect, useState } from "react";
import { getReturnWarrantySnapshot } from "@/lib/order-line";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const TICK_UNDER_TWO_DAYS_MS = 30_000;
const TICK_DEFAULT_MS = 60_000;

/**
 * Ticks at window expiry and every 30s–60s so return countdown stays accurate on screen.
 */
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
