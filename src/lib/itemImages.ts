import { resolveEntityImage } from "./entityImages";

/**
 * Item-specific shorthand kept for existing call sites. New code can call
 * `resolveEntityImage(img, "items")` directly.
 */
export function resolveItemImage(img: string | null | undefined): string {
  return resolveEntityImage(img, "items");
}
