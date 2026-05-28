import type { QueryClient } from "@tanstack/react-query";

/** Immediately refresh returns lists (and related orders) after a realtime event. */
export function refetchReturnsForCustomer(
  queryClient: QueryClient,
  customerId: string,
): void {
  void queryClient.refetchQueries({ queryKey: ["customer-returns", customerId] });
  void queryClient.refetchQueries({ queryKey: ["customer-orders", customerId] });
}

export function refetchReturnsForSupplier(
  queryClient: QueryClient,
  supplierId: string,
): void {
  void queryClient.refetchQueries({ queryKey: ["supplier-returns", supplierId] });
  void queryClient.refetchQueries({ queryKey: ["supplier-orders", supplierId] });
}

export function refetchReturnsForRole(
  queryClient: QueryClient,
  role: "customer" | "supplier",
  userId: string,
): void {
  if (role === "customer") {
    refetchReturnsForCustomer(queryClient, userId);
  } else {
    refetchReturnsForSupplier(queryClient, userId);
  }
}
