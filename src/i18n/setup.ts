import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import sv from './locales/sv.json';
import es from './locales/es.json';
import no from './locales/no.json';
import { deepMergeLocales } from './deepMergeLocales';
import { templeHomeEn } from './locales/templeHome';
import { templeHomeSvPartial } from './locales/templeHome/templeHomeSvPartial';
import { templeHomeEsPartial } from './locales/templeHome/templeHomeEsPartial';
import { templeHomeNoPartial } from './locales/templeHome/templeHomeNoPartial';
import { quantumApothecaryEn } from './locales/quantumApothecary';
import { quantumApothecarySvPartial } from './locales/quantumApothecary/quantumApothecarySvPartial';
import { quantumApothecaryEsPartial } from './locales/quantumApothecary/quantumApothecaryEsPartial';
import { quantumApothecaryNoPartial } from './locales/quantumApothecary/quantumApothecaryNoPartial';

const enRoot = deepMergeLocales(en as Record<string, unknown>, {
  templeHome: templeHomeEn,
  quantumApothecary: quantumApothecaryEn,
} as Record<string, unknown>);
const svMerged = deepMergeLocales(
  deepMergeLocales(enRoot, sv as Record<string, unknown>),
  {
    templeHome: deepMergeLocales(
      templeHomeEn as Record<string, unknown>,
      templeHomeSvPartial as Record<string, unknown>
    ),
    quantumApothecary: deepMergeLocales(
      quantumApothecaryEn as Record<string, unknown>,
      quantumApothecarySvPartial as Record<string, unknown>
    ),
  } as Record<string, unknown>
);
const esMerged = deepMergeLocales(
  deepMergeLocales(enRoot, es as Record<string, unknown>),
  {
    templeHome: deepMergeLocales(
      templeHomeEn as Record<string, unknown>,
      templeHomeEsPartial as Record<string, unknown>
    ),
    quantumApothecary: deepMergeLocales(
      quantumApothecaryEn as Record<string, unknown>,
      quantumApothecaryEsPartial as Record<string, unknown>
    ),
  } as Record<string, unknown>
);
const noMerged = deepMergeLocales(
  deepMergeLocales(enRoot, no as Record<string, unknown>),
  {
    templeHome: deepMergeLocales(
      templeHomeEn as Record<string, unknown>,
      templeHomeNoPartial as Record<string, unknown>
    ),
    quantumApothecary: deepMergeLocales(
      quantumApothecaryEn as Record<string, unknown>,
      quantumApothecaryNoPartial as Record<string, unknown>
    ),
  } as Record<string, unknown>
);

/**
 * Legacy i18n init (react-i18next): English, Spanish, Swedish, Norwegian.
 * Non-English bundles are deep-merged with English so every key exists and
 * profile.preferred_language drives a consistent UI app-wide.
 * Language is initialized from localStorage/navigator, then synced with
 * profile.preferred_language via ProfileLanguageSync when user is logged in.
 */
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enRoot as typeof en },
      es: { translation: esMerged as typeof en },
      sv: { translation: svMerged as typeof en },
      no: { translation: noMerged as typeof en },
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

if (typeof document !== 'undefined') {
  const syncHtmlLang = () => {
    document.documentElement.lang = (i18n.language || 'en').split('-')[0];
  };
  syncHtmlLang();
  i18n.on('languageChanged', syncHtmlLang);
}

export default i18n;

