import { supabase } from "@/lib/supabase";
import type { OrderStatus } from "@/lib/order-status";

export async function supplierSetOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
  const { error } = await supabase.rpc("supplier_set_order_status", {
    p_order_id: orderId,
    p_status: status,
  });
  if (error) throw new Error(error.message);
}

export async function supplierSetOrderItemStatus(
  orderItemId: string,
  status: OrderStatus,
): Promise<void> {
  const { error } = await supabase.rpc("supplier_set_order_item_status", {
    p_order_item_id: orderItemId,
    p_status: status,
  });
  if (error) throw new Error(error.message);
}
