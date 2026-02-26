import { getItemLanguage } from "@/features/meditations/getItemLanguage";
import type { ContentLanguage } from "@/utils/contentLanguage";

export type MeditationSectionKey =
  | "short"
  | "morning"
  | "sleep"
  | "healing"
  | "focus"
  | "nature"
  | "all";

function getDurationSec(item: any): number {
  const v =
    item?.durationSec ??
    item?.duration_seconds ??
    (item?.duration_minutes != null ? item.duration_minutes * 60 : undefined) ??
    item?.duration ??
    item?.lengthSec ??
    item?.length_seconds;

  if (typeof v === "number" && isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    if (isFinite(n)) return n;
  }
  return 8 * 60;
}

function textOf(item: any) {
  const title = (item?.title ?? item?.name ?? "").toString().toLowerCase();
  const tags = Array.isArray(item?.tags) ? item.tags.join(" ").toLowerCase() : "";
  const category = (item?.category ?? "").toString().toLowerCase();
  return `${title} ${tags} ${category}`;
}

export function filterByMeditationLanguage(items: any[], lang: ContentLanguage) {
  return items.filter((it) => {
    const itemLang = getItemLanguage(it);
    // Include items that match the selected language OR have unknown language (fallback)
    return itemLang === lang || itemLang === "unknown";
  });
}

export function sectionForItem(item: any): MeditationSectionKey {
  const t = textOf(item);
  const dur = getDurationSec(item);

  // Short resets first (2–5 min feels "easy")
  if (dur <= 5 * 60) return "short";

  if (t.includes("morgon") || t.includes("morning") || t.includes("sunrise"))
    return "morning";

  if (
    t.includes("sömn") ||
    t.includes("sleep") ||
    t.includes("night") ||
    t.includes("dream") ||
    t.includes("starlight")
  )
    return "sleep";

  if (t.includes("heal") || t.includes("läkning") || t.includes("chakra"))
    return "healing";

  if (t.includes("focus") || t.includes("fokus") || t.includes("intention"))
    return "focus";

  if (t.includes("nature") || t.includes("skog") || t.includes("ocean"))
    return "nature";

  return "all";
}

export function buildSections(items: any[]) {
  const sections: Record<MeditationSectionKey, any[]> = {
    short: [],
    morning: [],
    sleep: [],
    healing: [],
    focus: [],
    nature: [],
    all: [],
  };

  for (const item of items) {
    const key = sectionForItem(item);
    sections[key].push(item);
  }

  // Keep "all" as a catch-all (including everything), but avoid duplicates:
  const inAnySpecific = new Set(
    ["short", "morning", "sleep", "healing", "focus", "nature"]
      .flatMap((k) =>
        sections[k as MeditationSectionKey].map((i) => i?.id ?? i?.slug ?? i?.title)
      )
  );

  sections.all = items.filter((i) => {
    const id = i?.id ?? i?.slug ?? i?.title;
    return !inAnySpecific.has(id);
  });

  return sections;
}
