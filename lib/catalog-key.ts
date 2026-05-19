/** Groups the same product listing across suppliers (normalized title). */
export function catalogKeyFromTitle(title: string): string {
  return title.trim().toLowerCase().replace(/\s+/g, " ");
}
