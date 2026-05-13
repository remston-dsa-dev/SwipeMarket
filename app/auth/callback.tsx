import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { Redirect } from "expo-router";
import * as Linking from "expo-linking";
import { completeOAuthSessionFromUrlIfNeeded } from "@/lib/google-auth";

/**
 * OAuth redirect target. Session may already be completed in-app via
 * `WebBrowser.openAuthSessionAsync`; if the OS opens this route first, we finish the exchange here.
 */
export default function AuthCallbackScreen() {
  const hookUrl = Linking.useLinkingURL();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const urls = [
        hookUrl,
        Linking.getLinkingURL(),
        await Linking.getInitialURL(),
      ].filter((u): u is string => Boolean(u));
      const seen = new Set<string>();
      for (const u of urls) {
        if (cancelled) return;
        if (seen.has(u)) continue;
        seen.add(u);
        await completeOAuthSessionFromUrlIfNeeded(u);
      }
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [hookUrl]);

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0C0520" }}>
        <ActivityIndicator size="large" color="#A855F7" />
      </View>
    );
  }

  return <Redirect href="/" />;
}
