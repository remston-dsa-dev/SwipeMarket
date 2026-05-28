import type { OrderPartyInfo } from "@/components/order-card/OrderPartyBadge";
import type { CustomerOrder } from "@/hooks/useCustomerOrders";
import type { SupplierOrder } from "@/hooks/useSupplierOrders";

export type OrdersPartySection<T> = {
  partyId: string;
  party: OrderPartyInfo;
  orders: T[];
};

function partnerParty(order: CustomerOrder): OrderPartyInfo {
  return {
    name: order.supplier?.full_name ?? "",
    avatarUrl: order.supplier?.avatar_url ?? null,
    fallbackLabel: "Partner",
  };
}

function shopperParty(order: SupplierOrder): OrderPartyInfo {
  return {
    name: order.customer?.full_name ?? "",
    avatarUrl: order.customer?.avatar_url ?? null,
    fallbackLabel: "Shopper",
  };
}

function sortOrdersNewestFirst<T extends { created_at: string }>(orders: T[]): T[] {
  return [...orders].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

/** Shopper orders screen — one section per partner. */
export function groupCustomerOrdersByPartner(orders: CustomerOrder[]): OrdersPartySection<CustomerOrder>[] {
  const byPartner = new Map<string, CustomerOrder[]>();
  for (const order of orders) {
    const list = byPartner.get(order.supplier_id) ?? [];
    list.push(order);
    byPartner.set(order.supplier_id, list);
  }

  return Array.from(byPartner.entries())
    .map(([partyId, list]) => {
      const sorted = sortOrdersNewestFirst(list);
      return {
        partyId,
        party: partnerParty(sorted[0]!),
        orders: sorted,
      };
    })
    .sort(
      (a, b) =>
        new Date(b.orders[0]!.created_at).getTime() - new Date(a.orders[0]!.created_at).getTime(),
    );
}

/** Partner orders screen — one section per shopper. */
export function groupSupplierOrdersByShopper(orders: SupplierOrder[]): OrdersPartySection<SupplierOrder>[] {
  const byShopper = new Map<string, SupplierOrder[]>();
  for (const order of orders) {
    const list = byShopper.get(order.customer_id) ?? [];
    list.push(order);
    byShopper.set(order.customer_id, list);
  }

  return Array.from(byShopper.entries())
    .map(([partyId, list]) => {
      const sorted = sortOrdersNewestFirst(list);
      return {
        partyId,
        party: shopperParty(sorted[0]!),
        orders: sorted,
      };
    })
    .sort(
      (a, b) =>
        new Date(b.orders[0]!.created_at).getTime() - new Date(a.orders[0]!.created_at).getTime(),
    );
}
