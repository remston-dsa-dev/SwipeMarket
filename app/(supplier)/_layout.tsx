import { Stack } from "expo-router";

export default function SupplierLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="add-product" options={{ presentation: "modal" }} />
    </Stack>
  );
}
