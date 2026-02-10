import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import sv from './locales/sv.json';
import es from './locales/es.json';
import no from './locales/no.json';

/**
 * Legacy i18n init (react-i18next): English, Spanish, Swedish, Norwegian.
 * Language is initialized from localStorage/navigator, then synced with
 * profile.preferred_language via ProfileLanguageSync when user is logged in.
 */
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      es: { translation: es },
      sv: { translation: sv },
      no: { translation: no },
    },
    fallbackLng: 'en',
    supportedLngs: ['en', 'es', 'sv', 'no'],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;

