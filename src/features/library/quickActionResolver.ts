import type { ContentLanguage } from "@/utils/contentLanguage";
import { getItemLanguage } from "@/features/meditations/getItemLanguage";

export type QuickActionKey = "calm" | "heart" | "pause" | "sleep";

const TAGS: Record<QuickActionKey, string[]> = {
  calm: ["reset", "calm", "ground", "anxiety", "stress"],
  heart: ["heart", "comfort", "soften", "tender", "emotional"],
  pause: ["breath", "breathing", "1min", "minute", "pause"],
  sleep: ["sleep", "night", "bed", "unwind", "deep-sleep"],
};

function getTags(item: any): string[] {
  const tags = item?.tags ?? item?.metadata?.tags ?? [];
  if (Array.isArray(tags)) return tags.map((t) => String(t).toLowerCase());
  if (typeof tags === "string") return tags.split(",").map((t) => t.trim().toLowerCase());
  return [];
}

function getDurationSec(item: any): number {
  const v =
    item?.durationSec ??
    item?.duration_seconds ??
    item?.duration ??
    item?.lengthSec ??
    item?.length_seconds;
  if (typeof v === "number" && isFinite(v)) return v;
  const n = Number(v);
  return isFinite(n) ? n : 8 * 60;
}

function scoreItemForAction(item: any, key: QuickActionKey) {
  const tags = getTags(item);
  const dur = getDurationSec(item);

  const target =
    key === "pause" ? 60 :
    key === "calm" ? 180 :
    key === "heart" ? 420 :
    900;

  const durationScore = Math.max(0, 1000 - Math.abs(dur - target));
  const matchScore = TAGS[key].reduce((acc, t) => acc + (tags.includes(t) ? 250 : 0), 0);

  return matchScore + durationScore;
}

export function resolveQuickActionItem(items: any[], key: QuickActionKey, lang: ContentLanguage) {
  const candidates = items
    .filter((it) => getItemLanguage(it) === lang)
    .filter((it) => (it?.contentType ?? it?.type ?? "meditation") !== "music");

  if (!candidates.length) return null;

  let best: any = null;
  let bestScore = -Infinity;

  for (const it of candidates) {
    const s = scoreItemForAction(it, key);
    if (s > bestScore) { bestScore = s; best = it; }
  }
  return best;
}
