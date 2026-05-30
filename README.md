# SwipeMarket

SwipeMarket is a mobile marketplace built with **React Native** and **Expo**. Shoppers discover products with a Tinder-style swipe deck, add favorites to a cart, and check out. Partners (suppliers) list inventory, publish products, fulfill orders, and resolve returns—all in one app with role-based navigation after sign-up.

<p align="center">
  <img src="assets/images/home.png" alt="SwipeMarket landing screen" width="280" />
</p>

---

## Features

| Area | What you can do |
|------|-----------------|
| **Discovery** | Swipe right to like, left to pass; save matches and browse when the deck is empty |
| **Cart & checkout** | Persistent cart synced to Supabase; Stripe-ready checkout flow |
| **Orders** | Track order status end-to-end for shoppers and partners |
| **Returns** | Request returns with reasons; partners approve refunds or resolve disputes |
| **Inventory** | Partners manage live, on-hold, and allocated stock; publish with preview |
| **Real-time** | Optional Socket.io updates when `EXPO_PUBLIC_SOCKET_URL` is configured |

The UI uses a glassmorphism theme (blur surfaces, gradients, light/dark system appearance) and animated interactions throughout.

---

## Two roles, one app

After email verification, onboarding asks whether you are a **Shopper** or a **Partner**. That choice sets your role and which tab stack you see for the rest of the session.

### Shopper (customer)

Browse products like a swipe deck, build a cart, place orders, and manage returns from the orders flow.

<p align="center">
  <img src="assets/images/shopper/shopper-onboarding.png" alt="Shopper onboarding — choose role" width="220" />
  &nbsp;
  <img src="assets/images/shopper/swipe-right-watch.png" alt="Swipe right on a product" width="220" />
</p>

<p align="center">
  <img src="assets/images/shopper/swipe-right-airpods.png" alt="Discover another listing" width="220" />
  &nbsp;
  <img src="assets/images/shopper/shopper-empty-discover-page.png" alt="Empty discover feed" width="220" />
</p>

**Cart & checkout**

<p align="center">
  <img src="assets/images/shopper/shopper-cart.png" alt="Shopping cart" width="220" />
  &nbsp;
  <img src="assets/images/shopper/cart-checkout.png" alt="Checkout" width="220" />
</p>

**Orders & menu**

<p align="center">
  <img src="assets/images/shopper/shopper-orders.png" alt="Order history" width="220" />
  &nbsp;
  <img src="assets/images/shopper/shopper-order-status-reflected.png" alt="Order status detail" width="220" />
</p>

<p align="center">
  <img src="assets/images/shopper/shopper-menu.png" alt="Shopper account menu" width="220" />
</p>

**Returns**

<p align="center">
  <img src="assets/images/shopper/shopper-line-item-return-refund-button.png" alt="Return action on order line" width="220" />
  &nbsp;
  <img src="assets/images/shopper/shopper-request-return-reason.png" alt="Choose return reason" width="220" />
</p>

<p align="center">
  <img src="assets/images/shopper/shopper-request-return-status.png" alt="Return request status" width="220" />
  &nbsp;
  <img src="assets/images/shopper/shopper-return-screen.png" alt="Return detail screen" width="220" />
</p>

---

### Partner (supplier)

Partners use a dashboard for inventory shelves, publish flow, orders, and return resolution.

<p align="center">
  <img src="assets/images/partner/partner-onboarding.png" alt="Partner onboarding" width="220" />
  &nbsp;
  <img src="assets/images/partner/partner-menu.png" alt="Partner menu" width="220" />
</p>

**Inventory**

<p align="center">
  <img src="assets/images/partner/partner-empty-shelf.png" alt="Empty inventory shelf" width="220" />
  &nbsp;
  <img src="assets/images/partner/live-inventory01.png" alt="Live inventory" width="220" />
</p>

<p align="center">
  <img src="assets/images/partner/live-inventory02.png" alt="Live inventory list" width="220" />
  &nbsp;
  <img src="assets/images/partner/onhold.png" alt="On-hold stock" width="220" />
</p>

<p align="center">
  <img src="assets/images/partner/allocated.png" alt="Allocated inventory" width="220" />
</p>

**Publish**

<p align="center">
  <img src="assets/images/partner/publish-preview.png" alt="Publish preview" width="220" />
  &nbsp;
  <img src="assets/images/partner/publish-live.png" alt="Product live on marketplace" width="220" />
</p>

**Orders**

<p align="center">
  <img src="assets/images/partner/partner-order.png" alt="Partner orders" width="220" />
  &nbsp;
  <img src="assets/images/partner/partner-order-status-delivered.png" alt="Delivered order status" width="220" />
</p>

**Returns (partner side)**

<p align="center">
  <img src="assets/images/partner/partner-return-screen.png" alt="Incoming return request" width="220" />
  &nbsp;
  <img src="assets/images/partner/partner-return-resolve-screen.png" alt="Resolve return" width="220" />
</p>

<p align="center">
  <img src="assets/images/partner/partner-return-full-refund.png" alt="Full refund resolution" width="220" />
  &nbsp;
  <img src="assets/images/partner/partner-return-screen-post-resolution.png" alt="Return after resolution" width="220" />
</p>

---

## Authentication

Sign up with email and password (or Google where configured). Email confirmation deep-links back into the app; a welcome celebration screen runs once before the main experience.

<p align="center">
  <img src="assets/images/sign-in.png" alt="Sign in" width="220" />
  &nbsp;
  <img src="assets/images/create-account.png" alt="Create account" width="220" />
</p>

<p align="center">
  <img src="assets/images/email.png" alt="Check your email prompt" width="220" />
  &nbsp;
  <img src="assets/images/verify-email.png" alt="Verify email" width="220" />
</p>

<p align="center">
  <img src="assets/images/email-verified.png" alt="Email verified welcome" width="220" />
</p>

---

## Tech stack

- **Expo SDK 54** with **expo-router** (file-based routes)
- **React Native** + **TypeScript**
- **Supabase** — auth, profiles, products, orders, cart sync (`supabase/migrations/`)
- **TanStack Query** — server state
- **Zustand** — session and cart persistence
- **Stripe React Native** — payments (publishable key via env)
- **Socket.io client** — optional real-time events
- **NativeWind / Tailwind** — styling utilities alongside themed components

---

## Getting started

### Prerequisites

- Node.js 18+
- [Expo Go](https://expo.dev/go) on a device, or Xcode / Android Studio for simulators

### Install and run

```bash
git clone <your-repo-url>
cd SwipeMarket
npm install
cp .env.example .env   # then fill in keys (optional for local UI exploration)
npm start              # scan QR with Expo Go
npm run ios            # iOS simulator
npm run android        # Android emulator
```

Type-check without emitting files:

```bash
npx tsc --noEmit
```

### Environment variables

Copy `.env.example` to `.env`. All keys are optional—the app runs with placeholders when they are empty.

| Variable | Purpose |
|----------|---------|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project API URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon (public) key |
| `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key for checkout |
| `EXPO_PUBLIC_SOCKET_URL` | Socket.io server URL for live updates |

Values are read through `lib/env.ts` (`getExtra()` from `app.config.ts`)—do not read `process.env` directly in app code.

For Supabase auth redirects (email confirm, Google OAuth, password reset), follow the comments in `.env.example` and add the Expo / `swipemarket://` callback URLs in the Supabase dashboard.

### Database

Push migrations to your Supabase project:

```bash
npm run db:push
```

---

## Project layout (high level)

```
app/
  index.tsx              # Splash / landing / auth redirect
  (auth)/                # Sign-in, sign-up, forgot password
  onboarding/            # Profile + shopper vs partner choice
  (customer)/            # swipe, matches, orders, returns, favorites, more
  (supplier)/            # dashboard, orders, returns, add-product, more
  auth/                  # callback, welcome, reset-password
components/              # Screen, GlassSurface, ThemedText, etc.
hooks/                   # React Query data hooks + realtime
stores/                  # session-store, cart-store
theme/                   # ThemeProvider + AppTheme
supabase/migrations/     # SQL schema and RLS
assets/images/           # Screenshots used in this README
```

---

## License

Private project — all rights reserved unless otherwise noted by the repository owner.
