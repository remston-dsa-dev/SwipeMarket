/** Two-letter initials from a display name (first + last word, or first two chars). */
export function initialsFromDisplayName(name: string): string {
  const t = name.trim();
  if (!t) return "?";
  const parts = t.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase();
  }
  const one = parts[0] ?? t;
  return one.slice(0, 2).toUpperCase();
}

/** Google / OIDC profile image from Supabase user_metadata. */
export function googlePictureFromMetadata(meta: Record<string, unknown> | null | undefined): string | null {
  if (!meta) return null;
  const picture =
    (typeof meta.picture === "string" && meta.picture) ||
    (typeof meta.avatar_url === "string" && meta.avatar_url) ||
    null;
  return picture?.length ? picture : null;
}

export function displayNameFromUserMetadata(meta: Record<string, unknown> | null | undefined): string {
  if (!meta) return "";
  const full =
    (typeof meta.full_name === "string" && meta.full_name) ||
    (typeof meta.name === "string" && meta.name) ||
    "";
  if (full.trim()) return full.trim();
  const given = typeof meta.given_name === "string" ? meta.given_name : "";
  const family = typeof meta.family_name === "string" ? meta.family_name : "";
  return `${given} ${family}`.trim();
}
