/**
 * Healing page session content language only — does NOT affect app UI language.
 * Persist in localStorage under "healing:meditationLanguage".
 * Default from profile when user has never set it; else English.
 */
export type ContentLang = "sv" | "en";

export const HEALING_CONTENT_LANG_KEY = "healingLanguage";

export function getHealingContentLang(profileLang?: string | null): ContentLang {
  const stored = localStorage.getItem(HEALING_CONTENT_LANG_KEY);
  if (stored === "en" || stored === "sv") return stored;

  if (profileLang) {
    const base = profileLang.split("-")[0].toLowerCase();
    if (base.startsWith("sv")) return "sv";
    if (base.startsWith("en")) return "en";
  }

  return "en";
}

export function setHealingContentLang(lang: ContentLang) {
  localStorage.setItem(HEALING_CONTENT_LANG_KEY, lang);
}
