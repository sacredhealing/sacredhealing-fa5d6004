import type { ContentLang } from "@/utils/healingContentLanguage";

export interface HealingSessionItem {
  id: string;
  title: string;
  description: string | null;
  audio_url: string;
  preview_url: string | null;
  cover_image_url: string | null;
  duration_seconds: number;
  is_free: boolean;
  price_usd: number;
  price_shc: number;
  category: string;
  language: ContentLang;
  tags?: string[] | null;
  play_count?: number;
}

const SHORT_MAX_MINUTES = 10;
const SHORT_MAX_SECONDS = SHORT_MAX_MINUTES * 60;

function inferLanguage(item: { language?: string | null; title?: string }): ContentLang {
  const direct = item?.language;
  if (typeof direct === "string") {
    const v = direct.toLowerCase();
    if (v.startsWith("sv")) return "sv";
    if (v.startsWith("en")) return "en";
  }
  const title = (item?.title ?? "").toString().toLowerCase();
  if (title.includes("(sv)") || title.includes("svenska") || title.endsWith(" sv")) return "sv";
  return "en";
}

function withNormalizedLanguage<T extends { language?: string | null; title?: string }>(
  items: T[]
): (T & { language: ContentLang })[] {
  return items.map((it) => ({
    ...it,
    language: inferLanguage(it),
  })) as (T & { language: ContentLang })[];
}

export interface GetHealingSessionsResult {
  recommended: HealingSessionItem[];
  shortSessions: HealingSessionItem[];
  deepSessions: HealingSessionItem[];
  allInLanguage: HealingSessionItem[];
}

/**
 * Filter healing sessions by language and bucket into recommended (max 4),
 * short (max 6), deep (max 6). Language inferred from item.language or title if missing.
 */
export function getHealingSessions(
  bucket: HealingSessionItem[],
  language: ContentLang
): GetHealingSessionsResult {
  const normalized = withNormalizedLanguage(bucket) as HealingSessionItem[];
  const allInLanguage = normalized.filter((a) => a.language === language);

  const short = allInLanguage.filter(
    (a) => a.is_free || a.duration_seconds <= SHORT_MAX_SECONDS
  );
  const deep = allInLanguage.filter(
    (a) => !a.is_free && a.duration_seconds > SHORT_MAX_SECONDS
  );

  const recommended = [...allInLanguage]
    .sort((a, b) => {
      if (a.is_free !== b.is_free) return a.is_free ? -1 : 1;
      return (b.play_count ?? 0) - (a.play_count ?? 0);
    })
    .slice(0, 4);

  return {
    recommended,
    shortSessions: short.slice(0, 6),
    deepSessions: deep.slice(0, 6),
    allInLanguage,
  };
}
