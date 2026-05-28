import { useCallback } from "react";
import { useFocusEffect } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { refetchReturnsForRole } from "@/lib/returns-realtime-sync";

/** Refetch returns (and orders) whenever the returns screen is focused — pairs with layout realtime. */
export function useReturnsScreenRealtime(
  role: "customer" | "supplier",
  userId: string | null,
) {
  const queryClient = useQueryClient();

  useFocusEffect(
    useCallback(() => {
      if (!userId) return;
      refetchReturnsForRole(queryClient, role, userId);
    }, [queryClient, role, userId]),
  );
}
