import "../global.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { StripeProvider } from "@stripe/stripe-react-native";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { queryClient } from "@/lib/query-client";
import { getExtra } from "@/lib/env";
import { ThemeProvider } from "@/theme/ThemeContext";

export default function RootLayout() {
  const stripeKey = getExtra().stripePublishableKey;
  const tree = (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <Stack screenOptions={{ headerShown: false }} />
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );

  if (stripeKey.length > 0) {
    return <StripeProvider publishableKey={stripeKey}>{tree}</StripeProvider>;
  }

  return tree;
}
