import { useEffect, useState, useCallback } from "react";
import {
  getPreferredMeditationLanguage,
  setPreferredMeditationLanguage,
  MEDITATION_LANGUAGE_KEY,
  type ContentLanguage,
} from "@/utils/contentLanguage";
import { useProfile } from "@/hooks/useProfile";

/**
 * Meditation content filter only — does NOT affect app UI language.
 * Defaults from profile.preferred_language when user has never set it.
 */
export function useMeditationContentLanguage() {
  const { profile } = useProfile();
  const profileLang = profile?.preferred_language ?? null;

  const [language, setLanguageState] = useState<ContentLanguage>(() =>
    getPreferredMeditationLanguage(profileLang)
  );

  // When profile loads and user has never set meditation filter, default from profile
  useEffect(() => {
    const stored = localStorage.getItem(MEDITATION_LANGUAGE_KEY);
    if (!stored && profileLang) {
      const def = getPreferredMeditationLanguage(profileLang);
      setLanguageState(def);
      setPreferredMeditationLanguage(def);
    }
  }, [profileLang]);

  const setLanguage = useCallback((lang: ContentLanguage) => {
    setLanguageState(lang);
    setPreferredMeditationLanguage(lang);
  }, []);

  return { language, setLanguage };
}
