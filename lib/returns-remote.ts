import { supabase } from "@/lib/supabase";
import type { ReturnResolution } from "@/lib/return-resolution";

export async function createReturnRequest(
  orderItemId: string,
  qty: number,
  reason?: string,
): Promise<string> {
  const { data, error } = await supabase.rpc("customer_create_return_request", {
    p_order_item_id: orderItemId,
    p_qty: qty,
    p_reason: reason?.trim() || null,
  });
  if (error) throw new Error(error.message);
  return String(data);
}

export async function cancelReturnRequest(returnRequestId: string): Promise<void> {
  const { error } = await supabase.rpc("customer_cancel_return_request", {
    p_return_request_id: returnRequestId,
  });
  if (error) throw new Error(error.message);
}

export async function resolveReturnRequest(
  returnRequestId: string,
  resolution: Exclude<ReturnResolution, "pending">,
  refundCents: number,
  supplierNote?: string,
): Promise<void> {
  const { error } = await supabase.rpc("supplier_resolve_return_request", {
    p_return_request_id: returnRequestId,
    p_resolution: resolution,
    p_refund_cents: refundCents,
    p_supplier_note: supplierNote?.trim() || null,
  });
  if (error) throw new Error(error.message);
}
