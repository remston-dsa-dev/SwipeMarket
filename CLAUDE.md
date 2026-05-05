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
  _layout.tsx          — root layout: providers (Gesture, SafeArea, QueryClient, Theme, Stripe)
  index.tsx            — redirects to /sign-in, /swipe, or /dashboard based on session
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

Auth is currently demo-only — `sign-in.tsx` calls `setSession("demo-customer"|"demo-supplier", role)` directly, with no Supabase auth call yet. `stores/session-store.ts` persists `{ userId, role, themePreference }` to AsyncStorage via Zustand + `persist` middleware. The root `index.tsx` reads from this store to decide where to redirect.

### Theme System

`theme/ThemeContext.tsx` exports `ThemeProvider`, `useTheme()`, and the `AppTheme` type. The theme is derived from `themePreference` in the session store (light/dark/system) combined with `useColorScheme()`. All colors, radii, blur intensity, and typography variants live on the `AppTheme` object — never hardcode visual values in screens.

### Data Fetching

React Query (`@tanstack/react-query`) is used for all server state. `hooks/useListings.ts` and `hooks/useMatches.ts` currently return mock data; they will be wired to Supabase queries. The shared `QueryClient` is in `lib/query-client.ts`.

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
