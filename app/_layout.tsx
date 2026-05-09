import "../global.css";
import { useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { StripeProvider } from "@stripe/stripe-react-native";
import * as WebBrowser from "expo-web-browser";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { queryClient } from "@/lib/query-client";
import { getExtra } from "@/lib/env";
import { AuthProvider } from "@/providers/AuthProvider";
import { ThemeProvider } from "@/theme/ThemeContext";

export default function RootLayout() {
  useEffect(() => {
    WebBrowser.maybeCompleteAuthSession();
  }, []);

  const stripeKey = getExtra().stripePublishableKey;
  const tree = (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <ThemeProvider>
              <Stack screenOptions={{ headerShown: false }} />
            </ThemeProvider>
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );

  if (stripeKey.length > 0) {
    return <StripeProvider publishableKey={stripeKey}>{tree}</StripeProvider>;
  }

  return tree;
}
