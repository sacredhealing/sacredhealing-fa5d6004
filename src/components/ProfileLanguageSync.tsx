import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import i18n from '@/i18n/setup';

const SUPPORTED_LANGS = ['en', 'es', 'sv', 'no'];

/**
 * Syncs i18n language with the user's profile.preferred_language.
 * When profile loads with a preferred_language, updates the app language instantly.
 */
export const ProfileLanguageSync: React.FC = () => {
  const { user } = useAuth();
  const { profile } = useProfile();

  useEffect(() => {
    if (!user || !profile?.preferred_language) return;

    const lang = (profile.preferred_language || 'en').split('-')[0];
    if (SUPPORTED_LANGS.includes(lang)) {
      const currentBase = i18n.language?.split('-')[0] || 'en';
      if (currentBase !== lang) {
        i18n.changeLanguage(lang);
      }
    }
  }, [user, profile?.preferred_language]);

  return null;
};
