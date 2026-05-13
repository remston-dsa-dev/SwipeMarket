import type { ConfigContext, ExpoConfig } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "SwipeMarket",
  slug: "SwipeMarket",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  scheme: "swipemarket",
  userInterfaceStyle: "automatic",
  splash: {
    image: "./assets/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff",
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.swipemarket.app",
  },
  android: {
    package: "com.swipemarket.app",
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#ffffff",
    },
  },
  web: {
    favicon: "./assets/favicon.png",
    bundler: "metro",
  },
  plugins: [
    "expo-web-browser",
    [
      "expo-image-picker",
      {
        photosPermission: "SwipeMarket uses your photo for your profile picture.",
      },
    ],
    "expo-router",
    [
      "@stripe/stripe-react-native",
      {
        merchantIdentifier: "merchant.com.swipemarket.placeholder",
        enableGooglePay: false,
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? "",
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "",
    stripePublishableKey: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "",
    socketUrl: process.env.EXPO_PUBLIC_SOCKET_URL ?? "",
  },
});
