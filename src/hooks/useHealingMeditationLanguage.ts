import { useState, useEffect, useCallback } from "react";
import {
  getHealingContentLang,
  setHealingContentLang,
  HEALING_CONTENT_LANG_KEY,
  type ContentLang,
} from "@/utils/healingContentLanguage";
import { useProfile } from "@/hooks/useProfile";

/**
 * Healing page: meditation/session content language only (not app UI).
 * Persist in localStorage "healingLanguage". Default from profile when unset, else English.
 * State initialized from localStorage only to avoid flicker.
 */
export function useHealingMeditationLanguage() {
  const { profile } = useProfile();
  const profileLang = profile?.preferred_language ?? null;

  const [language, setLanguageState] = useState<ContentLang>(() => {
    const stored = typeof localStorage !== "undefined" ? localStorage.getItem(HEALING_CONTENT_LANG_KEY) : null;
    if (stored === "en" || stored === "sv") return stored;
    return "en";
  });

  useEffect(() => {
    const stored = localStorage.getItem(HEALING_CONTENT_LANG_KEY);
    if (!stored && profileLang) {
      const def = getHealingContentLang(profileLang);
      setLanguageState(def);
      setHealingContentLang(def);
    }
  }, [profileLang]);

  const setLanguage = useCallback((lang: ContentLang) => {
    setLanguageState(lang);
    setHealingContentLang(lang);
  }, []);

  return { language, setLanguage };
}
