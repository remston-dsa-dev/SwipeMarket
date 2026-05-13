import type { Href } from "expo-router";

/** Onboarding lives at `app/onboarding/` → `/onboarding` (not the group route `/(onboarding)`, which collided with `/`). */
export const HREF_ONBOARDING = "/onboarding" as unknown as Href;
