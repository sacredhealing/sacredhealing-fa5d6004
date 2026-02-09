import type { ContentLanguage } from "@/utils/contentLanguage";

// We keep this defensive: apps often have inconsistent metadata shapes.
export function getItemLanguage(item: any): ContentLanguage | "unknown" {
  const direct =
    item?.language ??
    item?.lang ??
    item?.locale ??
    item?.metadata?.language ??
    item?.metadata?.lang ??
    item?.meta?.language;

  if (typeof direct === "string") {
    const v = direct.toLowerCase();
    if (v.startsWith("sv")) return "sv";
    if (v.startsWith("en")) return "en";
  }

  // If the item has a title/description, we could infer (but inference can be wrong).
  // Safer: return unknown and show it in both lists.
  return "unknown";
}
