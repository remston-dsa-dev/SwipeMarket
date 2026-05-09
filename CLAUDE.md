# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start          # Start Expo dev server (opens QR code for Expo Go)
npm run ios        # Start with iOS simulator
npm run android    # Start with Android emulator
npm run web        # Start web build via Metro
```

There are no lint or test scripts configured yet. TypeScript type-checking can be run via `npx tsc --noEmit`.

## Environment

Copy `.env.example` to `.env` and fill in values before connecting to real backends. All four keys are optional — the app runs with placeholder/mock values when they are empty:

```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=
EXPO_PUBLIC_SOCKET_URL=
```

`lib/env.ts` reads these through `Constants.expoConfig.extra` (wired in `app.config.ts`). Never read `process.env` directly — always call `getExtra()`.

## Architecture

### Routing (expo-router file-based)

```
app/
  _layout.tsx          — root layout: providers (Gesture, SafeArea, QueryClient, AuthProvider, Theme, Stripe)
  index.tsx            — splash until auth hydrates; then landing or redirect by session + role
  (auth)/              — unauthenticated screens (no tab bar)
    sign-in.tsx
    sign-up.tsx
  (customer)/          — customer role screens
    swipe.tsx          — swipeable listing cards
    matches.tsx
  (supplier)/          — supplier role screens
    dashboard.tsx
```

### Auth & Session

Email/password auth uses Supabase (`sign-in.tsx`, `sign-up.tsx`). `providers/AuthProvider.tsx` syncs `supabase.auth` with `stores/session-store.ts` (persisted `userId` + `role`, plus `authInitialized` after the first session check). Profiles and roles come from the `profiles` table (created when a user signs up via an `auth.users` trigger — see `supabase/migrations/`). Configure `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` in `.env`; `lib/is-supabase-configured.ts` gates API calls. Route groups `(auth)`, `(customer)`, and `(supplier)` redirect by session and role.

### Theme System

`theme/ThemeContext.tsx` exports `ThemeProvider`, `useTheme()`, and the `AppTheme` type. The theme follows system light/dark via `useColorScheme()`. All colors, radii, blur intensity, and typography variants live on the `AppTheme` object — never hardcode visual values in screens.

### Data Fetching

React Query (`@tanstack/react-query`) is used for server state. `hooks/useListings.ts` reads published in-stock products from Supabase; `hooks/useSupplierProducts.ts` loads a supplier’s inventory. The cart (`stores/cart-store.ts`) stays on-device until checkout is wired to orders/Stripe. The shared `QueryClient` is in `lib/query-client.ts`.

### Real-time

`lib/socket.ts` exports a lazily-initialized singleton Socket.io client (`getSocket()`). It connects only when `EXPO_PUBLIC_SOCKET_URL` is set. Use `joinRoom` / `sendSocketMessage` / `disconnectSocket` — do not call `io()` directly elsewhere.

### Key Shared Components

| Component | Purpose |
|---|---|
| `Screen` | Full-screen `LinearGradient` + `SafeAreaView` wrapper — use for every screen |
| `GlassSurface` | `BlurView` card container with themed border radius and border |
| `ThemedText` | `Text` with `variant` (title/headline/body/caption/label) and `color` (primary/secondary/muted/onPrimary) props |
| `PressableScale` | Spring-animated pressable that scales to 0.96 on press |

### Path Alias

`@/` maps to the project root (configured in both `tsconfig.json` and `babel.config.js`). Use it for all non-relative imports.
