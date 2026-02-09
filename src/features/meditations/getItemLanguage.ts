import type { ContentLanguage } from "@/utils/contentLanguage";

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

  // Optional heuristic (ONLY if you have consistent filenames or voice ids)
  const url = (item?.audioUrl ?? item?.audio_url ?? item?.url ?? "").toString().toLowerCase();
  if (url.includes("/sv/") || url.includes("_sv") || url.includes("-sv")) return "sv";
  if (url.includes("/en/") || url.includes("_en") || url.includes("-en")) return "en";

  return "unknown";
}
