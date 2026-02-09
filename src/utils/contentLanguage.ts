export type ContentLanguage = "sv" | "en";

/** Meditation content filter only — does NOT affect app UI language. */
export const MEDITATION_LANGUAGE_KEY = "shc_meditation_content_language_v1";
const KEY = MEDITATION_LANGUAGE_KEY;

const LEGACY_KEY = "shc_content_language_v1";

export function getPreferredMeditationLanguage(profileLang?: string | null): ContentLanguage {
  let stored = localStorage.getItem(KEY);
  if (!stored) {
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy === "en" || legacy === "sv") {
      localStorage.setItem(KEY, legacy);
      stored = legacy;
    }
  }
  if (stored === "en" || stored === "sv") return stored;

  // Default from profile when no explicit choice
  if (profileLang) {
    const base = profileLang.split("-")[0].toLowerCase();
    if (base.startsWith("sv")) return "sv";
    if (base.startsWith("en")) return "en";
  }

  return "sv";
}

export function setPreferredMeditationLanguage(lang: ContentLanguage) {
  localStorage.setItem(KEY, lang);
}
