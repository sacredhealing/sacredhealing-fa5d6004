import type { ContentLanguage } from "@/utils/contentLanguage";
import { getItemLanguage } from "./getItemLanguage";

export type DayPhase = "morning" | "midday" | "evening";
export type UserState = "calm" | "busy" | "heavy" | "engaged";

// Works with any item shape; tries common duration fields.
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
  // Unknown duration: treat as medium.
  return 8 * 60;
}

function scoreByState(userState: UserState, durationSec: number) {
  // Target durations by state
  const target =
    userState === "busy"
      ? 2 * 60
      : userState === "heavy"
      ? 5 * 60
      : userState === "calm"
      ? 8 * 60
      : 12 * 60; // engaged

  // Closer duration = higher score
  const diff = Math.abs(durationSec - target);
  return Math.max(0, 1000 - diff); // simple
}

function scoreByDayPhase(dayPhase: DayPhase, item: any) {
  const title = (item?.title ?? item?.name ?? "").toString().toLowerCase();
  const tags = (item?.tags ?? []).join(" ").toLowerCase();
  const category = (item?.category ?? "").toString().toLowerCase();
  const text = `${title} ${tags} ${category}`;

  // Soft nudges, not hard filters
  if (dayPhase === "morning") {
    if (text.includes("morning") || text.includes("morgon")) return 80;
    if (text.includes("energ") || text.includes("focus") || text.includes("fokus"))
      return 40;
  }
  if (dayPhase === "evening") {
    if (text.includes("sleep") || text.includes("sömn") || text.includes("evening"))
      return 80;
    if (text.includes("wind") || text.includes("unwind") || text.includes("kväll"))
      return 40;
  }
  return 10;
}

export function selectStartNowItem(
  items: any[],
  ctx: { dayPhase: DayPhase; userState: UserState; language: ContentLanguage }
) {
  if (!items?.length) return null;

  const { dayPhase, userState, language } = ctx;

  let best: any = null;
  let bestScore = -Infinity;

  for (const item of items) {
    const lang = getItemLanguage(item);
    if (lang !== language) continue;

    const durationSec = getDurationSec(item);

    const s =
      scoreByState(userState, durationSec) +
      scoreByDayPhase(dayPhase, item) +
      25;

    if (s > bestScore) {
      bestScore = s;
      best = item;
    }
  }

  return best;
}
