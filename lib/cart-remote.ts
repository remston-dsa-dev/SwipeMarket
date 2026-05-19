import { isSupabaseConfigured } from "@/lib/is-supabase-configured";
import { supabase } from "@/lib/supabase";
import type { CartItem } from "@/types/cart";

export async function fetchMyCartLines(): Promise<CartItem[]> {
  if (!isSupabaseConfigured()) return [];
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("customer_cart_lines")
    .select("product_id, qty, title, price_label, image_url, unit_price_cents")
    .eq("customer_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => ({
    listingId: row.product_id,
    title: row.title,
    priceLabel: row.price_label,
    imageUrl: row.image_url,
    unitPriceCents: row.unit_price_cents,
    qty: row.qty,
  }));
}

export async function setCartLineQtyRemote(productId: string, qty: number): Promise<void> {
  const { error } = await supabase.rpc("set_cart_line_qty", {
    p_product_id: productId,
    p_qty: qty,
  });
  if (error) throw new Error(cartInventoryErrorMessage(error.message));
}

function cartInventoryErrorMessage(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("not enough units available from this partner")) {
    return "This partner only has that many units in stock. Lower the quantity or swipe the same product from another partner.";
  }
  if (lower.includes("not enough units available across suppliers")) {
    return "Not enough units are available across all suppliers for this product.";
  }
  if (lower.includes("products_stock_covers_hold_and_allocated")) {
    return "This partner cannot hold that many units. Lower the quantity — checkout can fill the rest from other partners in order.";
  }
  if (lower.includes("not enough units available for checkout")) {
    return "Not enough inventory is available to complete checkout. Reduce quantities or remove items and try again.";
  }
  return message;
}

export async function checkoutCartRemote(): Promise<void> {
  const { error } = await supabase.rpc("checkout_cart");
  if (error) throw new Error(cartInventoryErrorMessage(error.message));
}

/** Removes all server cart rows for the signed-in user (e.g. before sign-out). */
export async function clearMyServerCart(): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase.from("customer_cart_lines").delete().eq("customer_id", user.id);
  if (error) throw new Error(error.message);
}
