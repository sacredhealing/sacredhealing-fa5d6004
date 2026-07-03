import { useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import i18n from '@/i18n/setup';

const SUPPORTED_LANGS = ['en', 'es', 'sv', 'no'];
const LS_KEY = 'i18nextLng';

/**
 * Syncs i18n language with the user's profile.preferred_language.
 * When profile loads with a preferred_language, updates the app language instantly.
 * When a signed-in user has NO preferred_language yet (e.g. fresh signup), detects
 * their browser locale and writes it back to their profile once, so weekly emails
 * (Monday/Friday) can address them in the right language from day one.
 * On logout: fall back to localStorage language, else default "en".
 */
export const ProfileLanguageSync: React.FC = () => {
  const { user } = useAuth();
  const { profile, isLoading: profileLoading, updatePreferredLanguage } = useProfile();
  const backfillAttempted = useRef(false);

  useEffect(() => {
    if (user) {
      // Do not assume English while profile is still loading — that overwrote
      // localStorage / detector language before preferred_language arrived.
      if (profileLoading) return;

      const profileLang = profile?.preferred_language;

      if (!profileLang) {
        // No language on file — detect from browser and persist once.
        if (!backfillAttempted.current) {
          backfillAttempted.current = true;
          const browserLang = (navigator.language || 'en').split('-')[0];
          const detected = SUPPORTED_LANGS.includes(browserLang) ? browserLang : 'en';
          void updatePreferredLanguage(detected);
          if (i18n.language?.split('-')[0] !== detected) {
            void i18n.changeLanguage(detected);
          }
          try {
            localStorage.setItem(LS_KEY, detected);
          } catch {
            // ignore
          }
        }
        return;
      }

      const lang = profileLang.split('-')[0];
      if (!SUPPORTED_LANGS.includes(lang)) return;

      const currentBase = i18n.language?.split('-')[0] || 'en';
      if (currentBase !== lang) {
        void i18n.changeLanguage(lang);
      }
      try {
        localStorage.setItem(LS_KEY, lang);
      } catch {
        // ignore
      }
      return;
    }

    // Logged out: use localStorage as backup, else default "en"
    try {
      const stored = localStorage.getItem(LS_KEY);
      const fallback = stored && SUPPORTED_LANGS.includes(stored.split('-')[0])
        ? stored.split('-')[0]
        : 'en';
      if (i18n.language?.split('-')[0] !== fallback) {
        i18n.changeLanguage(fallback);
      }
    } catch {
      i18n.changeLanguage('en');
    }
  }, [user, profileLoading, profile?.preferred_language, updatePreferredLanguage]);

  return null;
};

